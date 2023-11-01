const express = require('express');
const authenticate = require('../middlewares/authentication');
const authorize = require('../middlewares/authorization');
const ReportController = require('../controllers/ReportController');
const router = express.Router();

// Rotas permitidas somente para "admin"
router.get('/sales', authenticate, authorize(['admin']), ReportController.getSalesReport);
router.get('/canceled-sales', authenticate, authorize(['admin']), ReportController.getCanceledSalesReport);
router.get('/products', authenticate, authorize(['admin']), ReportController.getProductsReport);
router.get('/comissions', authenticate, authorize(['admin']), ReportController.getCommissionsReport);
router.get('/sales-summary', authenticate, authorize(['admin']), ReportController.getSalesSummaryByMonth);
router.get('/sales-by-day', authenticate, authorize(['admin']), ReportController.getSalesGroupedByDay);

module.exports = router;