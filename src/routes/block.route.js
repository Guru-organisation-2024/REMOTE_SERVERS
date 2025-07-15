const express = require('express');
const BlockController = require('../controllers/block.controller');
const BlockService = require('../services/block.service');
const verifySignature = require('../middlewares/verifySignature');

const router = express.Router();

const blockService = new BlockService();
const blockController = new BlockController(blockService);

router.post('/', verifySignature, (req, res) => blockController.blockIp(req, res));

module.exports = router;
