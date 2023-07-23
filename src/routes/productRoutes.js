const express = require('express');
const authenticate = require('../middlewares/authentication');
const authorize = require('../middlewares/authorization');
const ProductController = require('../controllers/ProductController');
const router = express.Router();

// Rotas relacionadas ao CRUD de produtos
router.get('/', authenticate, ProductController.index);
router.get('/:id', authenticate, ProductController.show);
router.post('/', authenticate, authorize(['admin']), ProductController.store);
router.put('/:id', authenticate, authorize(['admin']), ProductController.update);
router.delete('/:id', authenticate, authorize(['admin']), ProductController.destroy);

module.exports = router;