const express = require('express');
const authenticate = require('../middlewares/authentication');
const authorize = require('../middlewares/authorization');
const UserController = require('../controllers/UserController');
const router = express.Router();
require('../config/passport');

// Rotas relacionadas ao CRUD de usuários
router.get('/', authenticate, authorize(['admin']), UserController.index);
router.get('/:id', authenticate, authorize(['admin']), UserController.show);
router.post('/', authenticate, authorize(['admin']), UserController.store);
router.put('/:id', authenticate, authorize(['admin']), UserController.update);
router.delete('/:id', authenticate, authorize(['admin']), UserController.destroy);

module.exports = router;