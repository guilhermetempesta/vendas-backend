const mongoose = require('mongoose');
const mongoUri = process.env.MONGODB_URI;

const dbConfig = async () => {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Conexão com o banco de dados configurada com sucesso!');
  } catch (error) {
    console.error('Erro ao configurar banco de dados:', error);
  }
};

module.exports = dbConfig;