const Product = require('../models/Product');

// exports.index = async (req, res) => {
//   try {
//     const products = await Product.find();
//     res.json(products);
//   } catch (error) {
//     console.error('Erro ao buscar produtos:', error);
//     res.status(500).json({ error: 'Erro ao buscar produtos' });
//   }
// };

exports.index = async (req, res) => {
  try {
    const search = req.query.search; // Obtém o termo de pesquisa da query

    let products;

    if (search) {
      // Se um termo de pesquisa foi fornecido, filtre os produtos com base nele
      products = await Product.find({ name: { $regex: search, $options: 'i' } });
    } else {
      // Se nenhum termo de pesquisa foi fornecido, busque todos os produtos
      products = await Product.find();
    }

    res.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
};

exports.show = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(product);
  } catch (error) {
    console.error('Erro ao buscar produto por ID:', error);
    res.status(500).json({ error: 'Erro ao buscar produto por ID' });
  }
};

exports.store = async (req, res) => {
  const { reference, name, price, cost, description } = req.body;

  try {
    const product = await Product.create({ reference, name, price, cost, description });
    res.status(201).json({
      message: 'Produto criado com sucesso!',
      data: {
        id: product._id,
        reference: product.reference,
        name: product.name,
        price: product.price,
        cost: product.cost,
        description: product.description,
      },
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { reference, name, price, cost, description } = req.body;

    // Verifica se o produto com o ID fornecido existe no banco de dados
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Atualiza os dados do produto com os novos valores
    product.reference = reference;
    product.name = name;
    product.price = price;
    product.cost = cost;
    product.description = description;

    // Salva as alterações no banco de dados
    await product.save();

    res.status(200).json({
      message: 'Produto atualizado com sucesso!',
      data: {
        id: product._id,
        reference: product.reference,
        name: product.name,
        price: product.price,
        cost: product.cost,
        description: product.description,
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
};

exports.destroy = async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se o produto com o ID fornecido existe no banco de dados
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Remove o produto do banco de dados usando o método deleteOne
    await Product.deleteOne({ _id: id });

    res.json({ message: 'Produto removido com sucesso!' });
  } catch (error) {
    console.error('Erro ao remover produto:', error);
    res.status(500).json({ error: 'Erro ao remover produto' });
  }
};