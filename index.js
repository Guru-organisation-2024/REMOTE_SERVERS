require('dotenv').config();
const app = require('./src/app');
const { sendLogs } = require('./src/jobs/sendLogs.job');
const { unblockIpPeriodically } = require('./src/jobs/unblockIpPeriodically.job');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);

    setInterval(() => {
        sendLogs();
        console.log("📤 Sending logs...");
    }, 60 * 60 * 1000);

    setInterval(() => {
        unblockIpPeriodically();
        console.log("📤 blocked ip live...");
    }, 60 * 60 * 1000);
});
