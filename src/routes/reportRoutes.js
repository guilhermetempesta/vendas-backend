const express = require('express');
const authenticate = require('../middlewares/authMiddleware');
const ReportController = require('../controllers/ReportController');
const router = express.Router();

router.get('/sales', authenticate, ReportController.getSalesReport);
router.get('/products', authenticate, ReportController.getProductsReport);
router.get('/commissions', authenticate, ReportController.getCommissionsReport);

module.exports = router;
