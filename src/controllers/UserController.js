const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtSecretKey = process.env.SECRET_KEY;

exports.registerUser = async (req, res, next) => {
  const { email, password, confirmPassword, name } = req.body;
  let role;

  try {
    const count = await User.countDocuments({ role: 'admin', active: true });
    (count === 0) ? role = 'admin' : role = 'user';  

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      const error = {
        statusCode: 400,
        message: 'Este e-mail já foi utilizado.'
      };
      throw error;
    }

    if (password !== confirmPassword) {
      const error = new Error('Senhas não conferem.');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.create({ email, password, name, role });
    res.status(201).json({
      message: "Usuário registrado com sucesso!",
      data: {
        id: user._id,
        email: user.email, 
        name: user.name,
        role: user.role,
        active: user.active
      }
    });
  } catch (error) {
    next(error); // Adicionado o parâmetro next para chamar o middleware de erro
  }
};

exports.loginUser = async (req, res, next) => {
  // Verificar se email e password foram informados
  const { email, password } = req.body;
  if (!email || !password) {
    const error = new Error('Email e senha devem ser informados.');
    error.statusCode = 400;
    throw error;
  }
  
  passport.authenticate('local', { session: false }, async (err, user, info) => {
    try {
      if (err) {
        return next(err);
      }

      if (!user) {
        const error = new Error(info.message)
        error.statusCode = 401;
        throw error;
        // return res.status(401).json({ message: info.message });
      }

      const token = await generateToken(user);
      const userLogged = {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }

      return res.status(200).json({ user: userLogged, token });
    } catch (error) {
      return next(error);
    }
  })(req, res, next);
};

async function generateToken(user) {
  try {
    const token = await jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name
      }, 
      jwtSecretKey, 
      { expiresIn: '12h' }
    );
    return token;
  } catch (error) {
    throw error;
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { email } = req.user;
    let { password, confirmPassword } = req.body;

    if (!password) {
      const error = new Error('Senha não informada.');
      error.statusCode = 400;
      throw error;
    }

    // Verifica se o usuário com o email fornecido existe no banco de dados
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('Usuário não encontrado.')
      error.statusCode = 404;
      throw error;
    }

    // Verifica se a confirmação da senha confere
    if (password !== confirmPassword) {
      const error = new Error('Senhas não conferem.');
      error.statusCode = 400;
      throw error;
    }

    // Atualiza a senha do usuário com a nova senha fornecida
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Salva as alterações no banco de dados
    await user.save();

    res.status(200).json({ message: 'Senha atualizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualiar senha do usuário:', error);
    next(error);
  }
};

exports.recoverPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error('Email não encontrado.')
      error.statusCode = 404;
      throw error;
    }

    // Aqui você pode implementar a lógica para enviar um email de recuperação de senha para o usuário
    // Por exemplo, gerar um token de recuperação e enviar um link para o usuário resetar a senha.

    res.status(200).json({ message: 'Email de recuperação de senha enviado com sucesso.' });
  } catch (error) {
    console.error('Erro recuperar senha do usuário:', error);
    next (error);
  }
};

exports.index = async (req, res, next) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    next(error);
  }
};

exports.show = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, { password: 0 });
    if (!user) {
      const error = new Error('Usuário não encontrado.')
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário por ID:', error);
    next (error);
  }
};

exports.store = async (req, res, next) => {
  const { email, password, confirmPassword, name, commission } = req.body;

  try {
    if (!name || !email || !password) {
      const error = new Error('Dados obrigatórios não informados.');
      error.statusCode = 400;
      throw error;
    }
    
    const emailExists = await User.findOne({ email });
    
    if (emailExists) {
      const error = {
        statusCode: 400,
        message: 'Este e-mail já foi utilizado.'
      };
      throw error;
    }

    if (password !== confirmPassword) {
      const error = new Error('Senhas não conferem.');
      error.statusCode = 400;
      throw error;
    }

    const active = true;
    const user = await User.create({ email, password, name, active, commission });
    res.status(201).json(
      {
        message: "Usuário criado com sucesso!",
        data: {
          id: user._id,
          email: user.email, 
          name: user.name,
          active: true,
          role: user.role,
          commission: user.commission
        }
      }
    );
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, name, role, active, commission } = req.body;

    // Verifica se o usuário com o ID fornecido existe no banco de dados
    const user = await User.findById(id);
    if (!user) {
      const error = new Error('Usuário não encontrado.')
      error.statusCode = 404;
      throw error;
    }

    // Atualiza os dados do usuário com os novos valores
    user.email = email;
    user.name = name;
    user.role = role;
    user.active = active;
    user.commission = commission;

    // Salva as alterações no banco de dados
    await user.save();

    res.status(200).json({
      message: 'Usuário atualizado com sucesso!',
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        active: user.active,
        role: user.role,
        commission: user.commission
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    next (error);
  }
};

exports.destroy = async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se o usuário com o ID fornecido existe no banco de dados
    const user = await User.findById(id);
    if (!user) {
      const error = new Error('Usuário não encontrado.')
      error.statusCode = 404;
      throw error;
    }

    // Remove o usuário do banco de dados usando o método deleteOne
    await User.deleteOne({ _id: id });

    res.status(200).json({ message: 'Usuário removido com sucesso!' });
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    next (error);
  }
};

exports.showProfile = async (req, res, next) => {
  try {
    const id = req.user._id;
    const user = await User.findById(id, { password: 0, commission: 0, role: 0, active: 0 });
    if (!user) {
      const error = new Error('Usuário não encontrado.')
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Erro ao buscar informações de perfil do usuário:', error);
    next (error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const id = req.user._id;
    const updateFields = req.body;

    // Verifica se o usuário com o ID fornecido existe no banco de dados
    const user = await User.findByIdAndUpdate(id, updateFields, { new: true });

    if (!user) {
      const error = new Error('Usuário não encontrado.')
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: 'Perfil do usuário atualizado com sucesso!',
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar as informações de perfil do usuário:', error);
    next(error);
  }
};