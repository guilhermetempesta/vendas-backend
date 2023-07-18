const express = require('express');
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const customerRoutes = require('./customerRoutes');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);

module.exports = router;