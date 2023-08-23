const handleError = (err, req, res, next) => {
  console.log('Tratamento de erros: ', err)
  const statusCode = err.statusCode || 500;
  const errorMessage = (statusCode != 500) ? err.message : 'Ocorreu um erro no servidor.';
  res.status(statusCode).json({
    message: errorMessage
  });
};

module.exports = handleError;
