const express = require('express');
const authenticate = require('../middlewares/authentication');
const authorize = require('../middlewares/authorization');
const ReportController = require('../controllers/ReportController');
const router = express.Router();

// Rotas permitidas somente para "admin"
router.get('/sales', authenticate, authorize(['admin']), ReportController.getSalesReport);
router.get('/products', authenticate, authorize(['admin']), ReportController.getProductsReport);
router.get('/commissions', authenticate, authorize(['admin']), ReportController.getCommissionsReport);

module.exports = router;