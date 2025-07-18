
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const LOG_PATH = process.env.MODSEC_LOG_PATH;
const NEST_API_ENDPOINT = process.env.NEST_API_ENDPOINT;
const SECRET = process.env.SECRET_KEY;
const SERVER_ID = process.env.SERVER_ID;
const USER_ID = process.env.USER_ID;

function generateHmacSignature(secret, timestamp, body) {
  return crypto.createHmac("sha256", secret).update(timestamp + body).digest("hex");
}

async function sendLogs() {

    try {
      const logData = fs.readFileSync(LOG_PATH, "utf-8");

      if (logData.trim() !== "") {
        const bodyPayload = {
          logs: logData,
          server: SERVER_ID,
          userId: USER_ID,
        };

        const bodyString = JSON.stringify(bodyPayload);
        const timestamp = Date.now().toString();
        const signature = generateHmacSignature(SECRET, timestamp, bodyString);

        const response = await axios.post(`${NEST_API_ENDPOINT}/modsec`, bodyPayload, {
          headers: {
            "Content-Type": "application/json",
            "X-Server-Id": SERVER_ID,
            "X-Timestamp": timestamp,
            "X-Signature": signature,
          },
        });

        console.log("✅ Log envoyé avec succès.");
      } else {
        console.log("🟡 Aucun contenu à envoyer.");
      }
    } catch (err) {
      if (err.response) {
        console.error("❌ Backend responded:", err.response.status);
        console.error("📩 Message:", err.response.data);
      } else if (err.request) {
        console.error("❌ No response from server.");
      } else {
        console.error("❌ Request setup error:", err.message);
      }
    }
}

module.exports = { sendLogs };
