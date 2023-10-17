const express = require('express');
const authenticate = require('../middlewares/authentication');
const authorize = require('../middlewares/authorization');
const DashboardController = require('../controllers/DashboardController');
const router = express.Router();

// Rotas permitidas somente para "admin"
router.get('/sales-current-month', authenticate, authorize(['admin']), DashboardController.getSalesCurrentMonth);
router.get('/total-sales-month', authenticate, authorize(['admin']), DashboardController.getTotalSalesCurrentMonth);
router.get('/last-sales', authenticate, authorize(['admin']), DashboardController.getLastSales);
router.get('/sales-by-month', authenticate, authorize(['admin']), DashboardController.getSalesByMonth);
router.get('/sales-by-seller', authenticate, authorize(['admin']), DashboardController.getSalesBySeller);

module.exports = router;