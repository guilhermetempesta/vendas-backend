const { Sale } = require('../models/Sale');

exports.index = async (req, res) => {
  try {
    const sales = await Sale.find({}).populate(['customer','items.product']);
    res.json(sales);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas' });
  }
};

exports.show = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await Sale.findById(id).populate(['customer','items.product']);

    if (!sale) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }

    res.json(sale);
  } catch (error) {
    console.error('Erro ao buscar venda por ID:', error);
    res.status(500).json({ error: 'Erro ao buscar venda por ID' });
  }
};

exports.store = async (req, res) => {
  const body = req.body;
  try {
    const sale = await Sale.create(body);
    res.status(201).json(sale);
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    res.status(500).json({ error: 'Erro ao criar venda' });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { customer, date, total, items } = req.body;

  try {
    const sale = await Sale.findById(id);

    if (!sale) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }

    sale.customer = customer;
    sale.date = date;
    sale.total = total;
    sale.items = items;

    const saleUpd = await sale.save();

    res.json(saleUpd);
  } catch (error) {
    console.error('Erro ao atualizar venda:', error);
    res.status(500).json({ error: 'Erro ao atualizar venda' });
  }
};

exports.destroy = async (req, res) => {
  const { id } = req.params;

  try {
    const sale = await Sale.findById(id);

    if (!sale) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }

    await Sale.deleteOne({ _id: id });

    res.json({ message: 'Venda removida com sucesso!' });
  } catch (error) {
    console.error('Erro ao remover venda:', error);
    res.status(500).json({ error: 'Erro ao remover venda' });
  }
};
