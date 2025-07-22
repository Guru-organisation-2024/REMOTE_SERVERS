const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class BlockService {
  constructor() {
    this.blockedFilePath = process.env.BLOCKED_IPS_PATH;
    this.blockedFilePathJson = process.env.BLOCKED_IPS_PATH_JSON;
  }

  async blockIp(ip, duration) {
    const jsonFile = this.blockedFilePathJson;
    const dataFile = this.blockedFilePath;

    try {
      if (!fs.existsSync(jsonFile)) {
        return { status: 404, message: `JSON file not found at ${jsonFile}` };
      }
      if (!fs.existsSync(dataFile)) {
        return { status: 404, message: `Data file not found at ${dataFile}` };
      }

      if (await this.isIpBlocked(ip)) {
        return { status: 404, message: ` This IP: ${ip} already blocked.` };
      }

      let jsonData = [];
      try {
        const fileContent = await fs.promises.readFile(jsonFile, 'utf-8');
        if (fileContent.trim()) {
          jsonData = JSON.parse(fileContent);
        } else {
          jsonData = [];
        }
      } catch (err) {
        if (err.code !== 'ENOENT') {
          return { status: 500, message: 'Failed to read or parse JSON file', error: err.message };
        }
      }

      const expiresAt = await this.calculateExpiryDate(duration);

      jsonData.push({ ip, expiresAt });
      await fs.promises.writeFile(jsonFile, JSON.stringify(jsonData, null, 2));

      await fs.promises.appendFile(dataFile, ip + '\n');

      try {
        await this.restartApache();
      } catch (apacheErr) {
        return {
          status: 500,
          message: `IP ${ip} blocked, but Apache restart failed.`,
          error: apacheErr.message,
        };
      }

      return {
        status: 200,
        message: `This IP: ${ip} blocked successfully.`,
      };

    } catch (err) {
      console.error(`❌ Error unblocking IP ${ip}:`, err);
      return {
        status: 500,
        message: `Unexpected error unblocking IP ${ip}`,
        error: err.message,
      };
    }
  }

  async unblockIp(ip) {
    const jsonFile = this.blockedFilePathJson;
    const dataFile = this.blockedFilePath;

    try {
      if (!fs.existsSync(jsonFile)) {
        return { status: 404, message: `JSON file not found at ${jsonFile}` };
      }
      if (!fs.existsSync(dataFile)) {
        return { status: 404, message: `Data file not found at ${dataFile}` };
      }

      if (!await this.isIpBlocked(ip)) {
        return { status: 404, message: ` This IP: ${ip} already unblocked.` };
      }

      const jsonDataRaw = fs.readFileSync(jsonFile, 'utf8');
      const dataFileRaw = fs.readFileSync(dataFile, 'utf8');

      let jsonData = [];
      try {
        jsonData = JSON.parse(jsonDataRaw);
      } catch (parseErr) {
        return { status: 500, message: 'Failed to parse JSON file', error: parseErr.message };
      }

      const newJsonData = jsonData.filter(entry => entry.ip !== ip);
      const newDataFileLines = dataFileRaw
        .split('\n')
        .filter(line => line.trim() !== '' && line.trim() !== ip);

      const jsonChanged = newJsonData.length !== jsonData.length;
      const dataChanged = newDataFileLines.length !== dataFileRaw.split('\n').filter(l => l.trim() !== '').length;

      if (!jsonChanged && !dataChanged) {
        return { status: 200, message: `IP ${ip} not found in either file.` };
      }

      if (jsonChanged) {
        fs.writeFileSync(jsonFile, JSON.stringify(newJsonData, null, 2) + '\n', 'utf8');
      }

      if (dataChanged) {
        fs.writeFileSync(dataFile, newDataFileLines.join('\n') + '\n', 'utf8');
      }

      try {
        await this.restartApache();
      } catch (apacheErr) {
        return {
          status: 500,
          message: `IP ${ip} removed, but Apache restart failed.`,
          error: apacheErr.message,
        };
      }

      return {
        status: 200,
        message: `IP ${ip} has been unblocked successfully.`,
      };

    } catch (err) {
      console.error(`❌ Error unblocking IP ${ip}:`, err);
      return {
        status: 500,
        message: `Unexpected error unblocking IP ${ip}`,
        error: err.message,
      };
    }
  }

  async isIpBlocked(ip) {
    try {
      const content = await fs.promises.readFile(this.blockedFilePath, 'utf-8');
      const blockedIps = content.split('\n').map(line => line.trim()).filter(Boolean);
      return blockedIps.includes(ip);
    } catch (err) {
      if (err.code === 'ENOENT') return false;
      throw err;
    }
  }

  async restartApache() {
    const restartCmd = process.env.APACHE_RESTART_CMD;
    return new Promise((resolve, reject) => {
      exec(restartCmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Apache restart error: ${error.message}`);
          return reject(error);
        }
        console.log('🔁 Apache restarted successfully.');
        resolve();
      });
    });
  }

  async calculateExpiryDate(duration) {
    const now = new Date();

    const number = parseInt(duration);
    const unit = duration.replace(number, '');

    switch(unit) {
      case 'h':
        now.setHours(now.getHours() + number);
        break;
      case 'd':
        now.setDate(now.getDate() + number);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + number);
        break;
    }
    return now.toISOString();
  }

}

module.exports = BlockService;
