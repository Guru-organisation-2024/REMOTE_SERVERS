const express = require('express');
const cors = require('cors');
const blockRoute = require('./routes/block.route');
require("dotenv").config();

const app = express();

const NEST_API_ENDPOINT = process.env.NEST_API_ENDPOINT;

app.use(cors({
  origin: `${NEST_API_ENDPOINT}`,
}));

app.use(express.json());

app.use('/api', blockRoute);

app.get('/hello-world', (req, res) => {
    res.json({ message: 'Hello from API!' });
});

module.exports = app;
