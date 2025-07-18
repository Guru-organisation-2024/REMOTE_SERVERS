const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class BlockService {
  constructor() {
    this.blockedFilePath = process.env.BLOCKED_IPS_PATH;
    this.blockedFilePathJson = process.env.BLOCKED_IPS_PATH_JSON;
  }

  async blockIp(ip, duration) {

    console.log(`🔒 Blocking IP: ${ip}`);
    console.log(`📅 Date: ${duration}`);
    // return { status: 409, message: ` This IP: ${ip} already blocked.` };

    if (await this.isIpBlocked(ip)) {
      console.log(`🟡 IP ${ip} already blocked.`);
      return { status: 409, message: ` This IP: ${ip} already blocked.` };
    }

    let jsonData = [];

    try {
      const fileContent = await fs.promises.readFile(this.blockedFilePathJson, 'utf-8');
      if (fileContent.trim()) {
        jsonData = JSON.parse(fileContent);
      } else {
        jsonData = [];
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    const expiresAt = await this.calculateExpiryDate(duration);

    jsonData.push({ ip, expiresAt });
    await fs.promises.writeFile(this.blockedFilePathJson, JSON.stringify(jsonData, null, 2));
    console.log(`📄 IP ${ip} with date ${duration} added to blocked_ips.json`);

    await fs.promises.appendFile(this.blockedFilePath, ip + '\n');
    console.log(`✅ IP ${ip} added to ${this.blockedFilePath}`);

    let restartError = null;
    try {
      await this.restartApache();
    } catch (error) {
      restartError = error.message;
      console.error(`⚠️ Apache restart failed: ${restartError}`);
    }

    if (restartError) {
      return {
        status: 500,
        message: `IP blocked, but Apache restart failed.`,
        error: restartError
      };
    }

    return {
      status: 200,
      message: `✅ This IP: ${ip} blocked successfully.`,
    };
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
