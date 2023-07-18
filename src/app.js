require('dotenv').config();
const express = require('express');
const passport = require('passport');
const connectDB = require('./config/database');
const routes = require('./routes');

// Crie uma instância do aplicativo Express
const app = express();

// Middlewares globais
app.use(express.json());
app.use(passport.initialize());

// Conexão com o banco de dados
connectDB();

// Use as rotas importadas
app.use('/api', routes); // Defina um prefixo de rota, por exemplo, '/api'

module.exports = app;