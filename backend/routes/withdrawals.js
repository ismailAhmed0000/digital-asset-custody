const express = require('express');
const router = express.Router();
const { createWithdrawal } = require('../controllers/withdrawalsController');

router.post('/', createWithdrawal);

module.exports = router;