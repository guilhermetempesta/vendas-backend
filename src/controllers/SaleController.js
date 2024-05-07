const { Sale } = require('../models/Sale');
const { initializeSequence, currentDate } = require('../utils/commons');
const { startOfDay, endOfDay, parseISO } = require('date-fns');

exports.index = async (req, res, next) => {
  try {

    if (!req.query.initialDate || !req.query.finalDate) {
      const error = new Error('Período não informado.');
      error.statusCode = 400;
      throw error;
    }

    const initialDate = startOfDay(parseISO(req.query.initialDate));
    const finalDate = endOfDay(parseISO(req.query.finalDate));
    
    let pipeline = [
      {
        $match: {
          date: {
            $gte: initialDate,
            $lte: finalDate
          },
          canceledAt: null
        }
      }
    ];

    if (req.query.customer) {
      pipeline = [
        ...pipeline,
        {
          $lookup: {
            from: 'customers', // Nome da coleção de Customer
            localField: 'customer',
            foreignField: '_id',
            as: 'customer'
          }
        },
        {
          $unwind: '$customer'
        },
        {
          $match: {
            'customer.name': new RegExp(req.query.customer, 'i')
          }
        }
      ];
    }

    const sales = await Sale.aggregate(pipeline).exec();

    // Preencha os campos relacionados após a execução da agregação
    await Sale.populate(sales, ['customer','items.product', { path: 'user', select: 'email name' }]);

    res.status(200).json(sales);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    next(error);
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

exports.store = async (req, res, next) => {
  const userId = req.user._id.toString();
  const sale = req.body; 
  const {addition, discount, total, date} = sale;

  console.log(sale)
  console.log('date: ', date);

  sale.user = userId;

  try {
    // Inicializa o documento de sequência
    await initializeSequence();

    // Cria uma nova instância do modelo Sale
    const newSale = new Sale(sale);

    // Rateia o desconto para os itens da venda (newSale)
    newSale.prorate();

    // Antes de executar o save, chama a função de pré e gera o valor do campo "code"
    await newSale.save();

    res.status(201).json(newSale);
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    next (error);
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { customer, date, subtotal, discount, addition, total, comments, items } = req.body;
  try {
    const sale = await Sale.findById(id);
    
    if (!sale) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }
    if (req.user.role !== 'admin' && sale.user.toString() !== req.user.id.toString()) {
      return res.status(401).json({ error: 'Não é permitido alterar vendas de outro usuário.' })
    }

    sale.customer = customer;
    // sale.date = date;
    sale.subtotal = subtotal;
    sale.discount = discount;
    sale.addition = addition;
    sale.total = total;
    sale.items = items;
    sale.comments = comments;

    // Rateia o desconto para os itens da venda (newSale)
    sale.prorate();

    const saleUpd = await sale.save();
    res.status(200).json(saleUpd);
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
    if (req.user.role !== 'admin') {
      return res.status(401).json({ error: 'O usuário não tem permissão para realizar cancelamentos.' })
    }

    sale.canceledAt = currentDate();
    sale.canceledBy = req.user.id;

    await sale.save();
    res.status(200).json({ message: 'Venda cancelada com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar venda:', error);
    res.status(500).json({ error: 'Erro ao atualizar venda' });
  }
};

exports.hasProduct = async (productId) => {
  try {
    const sales = await Sale.find({ 'items.product': productId });
    return sales.length > 0;
  } catch (error) {
    console.error('Erro ao verificar vendas do produto:', error);
    throw new Error('Erro ao verificar vendas do produto');
  }
};