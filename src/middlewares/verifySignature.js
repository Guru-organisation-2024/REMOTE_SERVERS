const crypto = require('crypto');

module.exports = (req, res, next) => {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  const secret = process.env.SECRET_KEY;

  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(timestamp + body)
    .digest('hex');

  if (expectedSignature !== signature) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  next();
};
