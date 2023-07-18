const express = require('express');
const authenticate = require('../middlewares/authMiddleware');
const UserController = require('../controllers/UserController');
const router = express.Router();
require('../config/passport');

// Rotas para login 
router.post('/register', UserController.registerUser);
router.post('/login', UserController.loginUser);

// Rotas relacionadas ao CRUD de usuários
router.get('/', authenticate, UserController.index);
router.get('/:id', authenticate, UserController.show);
router.post('/', authenticate, UserController.store);
router.put('/:id', authenticate, UserController.update);
router.delete('/:id', authenticate, UserController.destroy);

// Rotas para alterar/recuperar senha do usuário
router.post('/change-password', authenticate, UserController.replacePassword);
router.post('/recover-password', UserController.recoverPassword);

module.exports = router;