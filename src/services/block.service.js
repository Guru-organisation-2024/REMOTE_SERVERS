const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class BlockService {
  constructor(blockedFilePath) {
    this.blockedFilePath = blockedFilePath || process.env.BLOCKED_IPS_PATH;
  }

  async blockIp(ip) {

    // console.log(`🔒 Blocking IP: ${ip}`);

    if (await this.isIpBlocked(ip)) {
      console.log(`🟡 IP ${ip} already blocked.`);
      return { status: 409, message: ` This IP: ${ip} already blocked.` };
    }

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
}

module.exports = BlockService;
