const express = require('express');
const router = express.Router();
const {getAllMetals} = require('../controllers/metalController');

router.get('/', getAllMetals);

module.exports = router;