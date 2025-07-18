const fs = require('fs');
const path = require('path');
const axios = require("axios");
const crypto = require("crypto");

const BLOCKED_FILE_PATH = process.env.BLOCKED_IPS_PATH; 
const BLOCKED_FILE_PATH_JSON = process.env.BLOCKED_IPS_PATH_JSON; 
const NEST_API_ENDPOINT = process.env.NEST_API_ENDPOINT;
const SECRET = process.env.SECRET_KEY;
const SERVER_ID = process.env.SERVER_ID;
const USER_ID = process.env.USER_ID;

function generateHmacSignature(secret, timestamp, body) {
  return crypto.createHmac("sha256", secret).update(timestamp + body).digest("hex");
}

async function unblockIp() {
  try {
    // const jsonData = fs.readFileSync(BLOCKED_FILE_PATH_JSON, 'utf8');
    // let ipList = JSON.parse(jsonData);

    // const now = new Date();
    // const activeIps = ipList.filter(entry => new Date(entry.expiresAt) > now);

    // const expiredIps = ipList.filter(entry => new Date(entry.expiresAt) <= now).map(entry => entry.ip);

    // fs.writeFileSync(BLOCKED_FILE_PATH_JSON, JSON.stringify(activeIps, null, 2));

    // const dataFileContent = fs.readFileSync(BLOCKED_FILE_PATH, 'utf8');
    // const allBlockedIps = dataFileContent.split('\n').filter(line => line.trim() !== '');

    // const updatedData = allBlockedIps.filter(ip => !expiredIps.includes(ip));

    // fs.writeFileSync(BLOCKED_FILE_PATH, updatedData.join('\n'));

    const expiredIps = "192.168.1.131";

    const bodyPayload = {
      ip: expiredIps,
      server: SERVER_ID,
      userId: USER_ID,
    };

    const bodyString = JSON.stringify(bodyPayload);
    const timestamp = Date.now().toString();
    const signature = generateHmacSignature(SECRET, timestamp, bodyString);


    const response = await axios.post(`${NEST_API_ENDPOINT}/block-ip/update`, bodyPayload, {
      headers: {
        "Content-Type": "application/json",
        "X-Server-Id": SERVER_ID,
        "X-Timestamp": timestamp,
        "X-Signature": signature,
      },
    });

    console.log("✅ Unblocked IPs sent successfully:", expiredIps);

    // console.log(`✅ Unblocked ${expiredIps.length} IP(s):`, expiredIps);
  } catch (error) {
    console.error('❌ Error unblocking IPs:', error);
  }
}

module.exports = { unblockIp };

