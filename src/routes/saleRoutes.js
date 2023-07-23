const express = require('express');
const authenticate = require('../middlewares/authentication');
const authorize = require('../middlewares/authorization');
const SaleController = require('../controllers/SaleController');
const router = express.Router();

// Rotas relacionadas ao CRUD de vendas
router.get('/', authenticate, SaleController.index);
router.get('/:id', authenticate, SaleController.show);
router.post('/', authenticate, SaleController.store);
router.put('/:id', authenticate, authorize(['admin']), SaleController.update);
router.delete('/:id', authenticate, authorize(['admin']), SaleController.destroy);

module.exports = router;
