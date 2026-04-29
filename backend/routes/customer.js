const express = require('express');
const router = express.Router();
const {getAllCustomers, createCustomer, getCustomerAccount} = require('../controllers/customerController');

router.get('/', getAllCustomers);
router.post('/', createCustomer);
router.get('/:id', getCustomerAccount);

module.exports = router;