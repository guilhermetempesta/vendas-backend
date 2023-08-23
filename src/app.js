require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const dbConfig = require('./config/database');
const handleError = require('./middlewares/errorHandling');
const routes = require('./routes');

// Crie uma instância do aplicativo Express
const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Configurações de conexão com o banco de dados
dbConfig();

// Usar as rotas importadas
app.use('/api', routes); // Definido o prefixo de rota, '/api'

// Middleware para tratamento de erros
app.use(handleError);

module.exports = app;