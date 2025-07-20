const express = require('express');
const BlockController = require('../controllers/block.controller');
const BlockService = require('../services/block.service');
const verifySignature = require('../middlewares/verifySignature');

const router = express.Router();

const blockService = new BlockService();
const blockController = new BlockController(blockService);

router.post('/block', verifySignature, (req, res) => blockController.blockIp(req, res));
router.post('/unblock', verifySignature, (req, res) => blockController.unblockIp(req, res));


module.exports = router;
