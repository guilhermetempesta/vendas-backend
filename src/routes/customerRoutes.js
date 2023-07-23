const express = require('express');
const authenticate = require('../middlewares/authentication');
const authorize = require('../middlewares/authorization');
const CustomerController = require('../controllers/CustomerController');
const router = express.Router();

// Rotas relacionadas ao CRUD de clientes
router.get('/', authenticate, CustomerController.index);
router.get('/:id', authenticate, CustomerController.show);
router.post('/', authenticate, CustomerController.store);
router.put('/:id', authenticate, CustomerController.update);
router.delete('/:id', authenticate, authorize(['admin']), CustomerController.destroy);

module.exports = router;