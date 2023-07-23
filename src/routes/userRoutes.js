const express = require('express');
const authenticate = require('../middlewares/authentication');
const authorize = require('../middlewares/authorization');
const UserController = require('../controllers/UserController');
const router = express.Router();
require('../config/passport');

// Rotas para login 
router.post('/register', UserController.registerUser);
router.post('/login', UserController.loginUser);

// Rotas relacionadas ao CRUD de usuários
router.get('/', authenticate, authorize(['admin']), UserController.index);
router.get('/:id', authenticate, authorize(['admin']), UserController.show);
router.post('/', authenticate, authorize(['admin']), UserController.store);
router.put('/:id', authenticate, authorize(['admin']), UserController.update);
router.delete('/:id', authenticate, authorize(['admin']), UserController.destroy);

// Rotas para alterar/recuperar senha do usuário
router.post('/change-password', authenticate, UserController.replacePassword);
router.post('/recover-password', UserController.recoverPassword);

module.exports = router;