const Customer = require('../models/Customer');

exports.index = async (req, res) => {
  try {
    const name = req.query.name;

    let query = {};
    if (name) {
      query = {
        name: {
          $regex: name, 
          $options: "i" 
        }
      };
    }

    const customers = await Customer.find(query);
    res.json(customers);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
};

exports.show = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Erro ao buscar cliente por ID:', error);
    res.status(500).json({ error: 'Erro ao buscar cliente por ID' });
  }
};

exports.store = async (req, res) => {
  const { name, phone, address, code, comment } = req.body;

  try {
    const customer = await Customer.create({ name, phone, address, code, comment });
    res.status(201).json({
      message: 'Cliente criado com sucesso!',
      data: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        code: customer.code,
        comment: customer.comment,
      },
    });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, code, comment } = req.body;

    // Verifica se o cliente com o ID fornecido existe no banco de dados
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Atualiza os dados do cliente com os novos valores
    customer.name = name;
    customer.phone = phone;
    customer.address = address;
    customer.code = code;
    customer.comment = comment;

    // Salva as alterações no banco de dados
    await customer.save();

    res.json({
      message: 'Cliente atualizado com sucesso!',
      data: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        code: customer.code,
        comment: customer.comment,
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
};

exports.destroy = async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se o cliente com o ID fornecido existe no banco de dados
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Verifica se o cliente possui vendas associadas
    const customerHasSales = await hasSales(id);
    if (customerHasSales) {
      return res.status(403).json({ error: 'Não é permitido excluir um cliente com vendas vinculadas.' });
    }

    // Remove o cliente do banco de dados usando o método deleteOne
    await Customer.deleteOne({ _id: id });

    res.status(200).json({ message: 'Cliente removido com sucesso!' });
  } catch (error) {
    console.error('Erro ao remover cliente:', error);
    res.status(500).json({ error: 'Erro ao remover cliente' });
  }
};

const hasSales = async (customerId) => {
  try {
    // Verifica se existem vendas associadas ao cliente pelo ID
    const {Sale} = require('../models/Sale');
    const salesCount = await Sale.find({ customer: customerId });
    return salesCount.length > 0;
  } catch (error) {
    console.error('Erro ao verificar vendas do cliente:', error);
    throw new Error('Erro ao verificar vendas do cliente');
  }
};