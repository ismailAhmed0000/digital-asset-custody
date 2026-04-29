const express = require('express');
const router = express.Router();
const { createDeposit } = require('../controllers/depositsController');

router.post('/', createDeposit);

module.exports = router;