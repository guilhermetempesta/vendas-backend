const express = require('express');
const authenticate = require('../middlewares/authMiddleware');
const ProductController = require('../controllers/ProductController');
const router = express.Router();

// Rotas relacionadas ao CRUD de produtos
router.get('/', authenticate, ProductController.index);
router.get('/:id', authenticate, ProductController.show);
router.post('/', authenticate, ProductController.store);
router.put('/:id', authenticate, ProductController.update);
router.delete('/:id', authenticate, ProductController.destroy);

module.exports = router;