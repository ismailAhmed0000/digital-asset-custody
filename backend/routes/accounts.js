// backend/routes/accounts.js
const express = require('express');
const router = express.Router();
const { getPortfolio, getTransactions } = require('../controllers/accountsController');

router.get('/:id/portfolio', getPortfolio);
router.get('/:id/transactions', getTransactions);

module.exports = router;