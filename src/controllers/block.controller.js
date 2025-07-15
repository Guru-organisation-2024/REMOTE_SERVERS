class BlockController {
    constructor(blockService) {
        this.blockService = blockService;
    }

    async blockIp(req, res) {
        const { ip } = req.body;

        if (!ip) {
            return res.status(400).json({ error: 'IP are required.' });
        }

        try {
            const result = await this.blockService.blockIp(ip);
            
           return res.status(result.status).json(result);
        } catch (error) {
            console.error('Error blocking IP:', error);
            return res.status(500).json({ error: 'Failed to block IP.' });
        }
    }
}

module.exports = BlockController;