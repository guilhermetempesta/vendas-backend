const express = require('express');
const authenticate = require('../middlewares/authentication');
const UserController = require('../controllers/UserController');
const router = express.Router();
require('../config/passport');

// Rotas para login / registro de novos usuários 
router.post('/register', UserController.registerUser);
router.post('/login', UserController.loginUser);

// Rotas para alterar / recuperar senha do usuário
router.patch('/change-password', authenticate, UserController.changePassword);
router.post('/recover-password', UserController.recoverPassword);

// Rota para acessar perfil do usuário
router.get('/profile', authenticate, UserController.showProfile);
router.patch('/profile', authenticate, UserController.updateProfile);

module.exports = router;