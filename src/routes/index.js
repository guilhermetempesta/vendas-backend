const express = require('express');
const loginRoutes = require('./loginRoutes');
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const customerRoutes = require('./customerRoutes');
const saleRoutes = require('./saleRoutes');
const reportRoutes = require('./reportRoutes');

const router = express.Router();

router.use('/', loginRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/sales', saleRoutes);
router.use('/reports', reportRoutes);

module.exports = router;