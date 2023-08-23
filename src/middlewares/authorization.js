const authorize = (requiredRoles) => (req, res, next) => {

  // Verifica se o usuário está autenticado
  // if (!req.user) {
  //   return res.status(401).json({ error: 'Usuário não autenticado' });
  // }
  if (!req.user) {
    const error = new Error('Usuário não autenticado');
    error.statusCode = 401;
    return next(error); // Passa o erro para o próximo middleware (handleError)
  }

  // Verifica se o atributo "role" está presente no usuário
  // if (!req.user.role) {
  //   return res.status(403).json({ error: 'Usuário não possui permissão' });
  // }
  if (!req.user.role) {
    const error = new Error('Usuário não possui permissão');
    error.statusCode = 403;
    return next(error); // Passa o erro para o próximo middleware (handleError)
  }

  // Verifica se o usuário possui uma das roles requeridas para acessar a rota
  // if (!requiredRoles.includes(req.user.role)) {
  //   return res.status(403).json({ error: 'Usuário não possui permissão' });
  // }
  if (!requiredRoles.includes(req.user.role)) {
    const error = new Error('Usuário não possui permissão');
    error.statusCode = 403;
    return next(error); // Passa o erro para o próximo middleware (handleError)
  }

  // Se o usuário possui uma das roles corretas, continua para a próxima middleware ou rota
  next();
};

module.exports = authorize;