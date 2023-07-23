const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtSecretKey = process.env.SECRET_KEY;

exports.registerUser = async (req, res) => {
  const { email, password, name } = req.body;
  let role;

  try {
    const count = await User.countDocuments({ role: 'admin', active: true });
    (count === 0) ? role = 'admin' : role = 'user';  

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(401).json({ message: 'Este e-mail já foi utilizado.' });
    }

    const user = await User.create({ email, password, name, role });
    res.status(201).json(
      {
        message: "Usuário registrado com sucesso!",
        data: {
          id: user._id,
          email: user.email, 
          name: user.name,
          role: user.role,
          active: user.active
        }
      }
    );
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

exports.loginUser = async (req, res, next) => {
  // Verificar se email e password foram informados
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha devem ser informados.' });
  }
  
  passport.authenticate('local', { session: false }, async (err, user, info) => {
    try {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(401).json({ message: info.message });
      }

      const token = await generateToken(user);

      return res.json({ token });
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
      { expiresIn: '1h' }
    );
    return token;
  } catch (error) {
    throw error;
  }
};

exports.replacePassword = async (req, res) => {
  try {
    const { email } = req.user;
    let { newPassword } = req.body;

    // Verifica se o usuário com o email fornecido existe no banco de dados
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Atualiza a senha do usuário com a nova senha fornecida
    const salt = await bcrypt.genSalt(10);
    newPassword = await bcrypt.hash(newPassword, salt);
    user.password = newPassword;

    // Salva as alterações no banco de dados
    await user.save();

    res.json({ message: 'Senha atualizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar senha do usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar senha do usuário' });
  }
};

exports.recoverPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Email não encontrado.' });
    }

    // Aqui você pode implementar a lógica para enviar um email de recuperação de senha para o usuário
    // Por exemplo, gerar um token de recuperação e enviar um link para o usuário resetar a senha.

    res.json({ message: 'Email de recuperação de senha enviado com sucesso.' });
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário por email' });
  }
};

exports.index = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
};

exports.show = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, { password: 0 });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário por ID:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário por ID' });
  }
};

exports.store = async (req, res) => {
  const { email, password, name, commission } = req.body;

  try {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(401).json({ message: 'Este e-mail já foi utilizado.' });
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
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role, active, commission } = req.body;

    // Verifica se o usuário com o ID fornecido existe no banco de dados
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Atualiza os dados do usuário com os novos valores
    user.email = email;
    user.name = name;
    user.role = role;
    user.active = active;
    user.commission = commission;

    // Salva as alterações no banco de dados
    await user.save();

    res.json({
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
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
};

exports.destroy = async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se o usuário com o ID fornecido existe no banco de dados
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Remove o usuário do banco de dados usando o método deleteOne
    await User.deleteOne({ _id: id });

    res.json({ message: 'Usuário removido com sucesso!' });
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    res.status(500).json({ error: 'Erro ao remover usuário' });
  }
};