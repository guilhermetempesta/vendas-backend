const express = require('express');
const authenticate = require('../middlewares/authMiddleware');
const SaleController = require('../controllers/SaleController');
const router = express.Router();

// Rotas relacionadas ao CRUD de vendas
router.get('/', authenticate, SaleController.index);
router.get('/:id', authenticate, SaleController.show);
router.post('/', authenticate, SaleController.store);
router.put('/:id', authenticate, SaleController.update);
router.delete('/:id', authenticate, SaleController.destroy);

module.exports = router;
