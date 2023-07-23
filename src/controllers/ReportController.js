const mongoose = require('mongoose');
const { Sale } = require('../models/Sale');
const { Product } = require('../models/Product');
const { User } = require('../models/User');

// Método para buscar vendas por período, usuário, cliente e produtos
exports.getSalesReport = async (req, res) => {
  try {
    // Recebe os parâmetros do filtro da requisição
    const { startDate, endDate, userId, customerId, products } = req.query;

    // Cria um objeto vazio para montar a consulta com os filtros
    const query = {};

    // Se foi fornecida uma data de início, adiciona o filtro
    if (startDate) {
      query.date = { $gte: new Date(startDate) };
    }

    // Se foi fornecida uma data de fim, adiciona o filtro
    if (endDate) {
      // Incrementa um dia na data de fim para incluir as vendas do último dia
      query.date.$lte = new Date(endDate);
    }

    // Se foi fornecido um ID de usuário, adiciona o filtro
    if (userId) {
      query.user = userId;
    }

    // Se foi fornecido um ID de cliente, adiciona o filtro
    if (customerId) {
      query.customer = customerId;
    }

    // Realiza a consulta no banco de dados
    const sales = await Sale.find(query).populate('customer user', '-password').populate('items.product');

    res.json(sales);
  } catch (error) {
    console.error('Erro ao buscar relatório de vendas:', error);
    res.status(500).json({ error: 'Erro ao buscar relatório de vendas' });
  }
};

exports.getProductsReport = async (req, res) => {
  try {
    const { startDate, endDate, userId, productId } = req.query;

    // Cria um objeto vazio para montar a consulta com os filtros
    const query = {};

    // Se foi fornecida uma data de início, adiciona o filtro
    if (startDate) {
      query.date = { $gte: new Date(startDate) };
    }

    // Se foi fornecida uma data de fim, adiciona o filtro
    if (endDate) {
      query.date.$lte = new Date(endDate);
    }

    // Se foi fornecido um ID de usuário, adiciona o filtro
    if (userId) {
      query.user = userId;
    }

    // Realiza a consulta no banco de dados e popula o campo 'items.product'
    const sales = await Sale.find(query).populate('items.product');

    // Cálculos para o relatório de produtos
    const productsData = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const productIdStr = item.product._id.toString();
        if (!productsData[productIdStr]) {
          productsData[productIdStr] = {
            id: item.product._id,
            name: item.product.name,
            soldAmount: 0,
            unitCost: item.product.cost,
            totalCost: 0,
            totalSales: 0,
            resultValue: 0,
            resultPercent: 0,
          };
        }

        productsData[productIdStr].soldAmount += item.quantity;
        productsData[productIdStr].totalCost += item.quantity * item.product.cost;
        productsData[productIdStr].totalSales += item.totalPrice;
        productsData[productIdStr].resultValue = productsData[productIdStr].totalSales - productsData[productIdStr].totalCost;
      });
    });

    // Calcular o percentual de lucro corretamente
    for (const productId in productsData) {
      productsData[productId].resultPercent = (productsData[productId].resultValue / productsData[productId].totalCost) * 100;
      productsData[productId].resultPercent = parseFloat(productsData[productId].resultPercent.toFixed(2));
      productsData[productId].unitCost = parseFloat(productsData[productId].unitCost.toFixed(2));
      productsData[productId].totalCost = parseFloat(productsData[productId].totalCost.toFixed(2));
      productsData[productId].totalSales = parseFloat(productsData[productId].totalSales.toFixed(2));
      productsData[productId].resultValue = parseFloat(productsData[productId].resultValue.toFixed(2));
    }

    // Verificar se foi fornecido um ID de produto para filtrar os resultados
    if (productId) {
      const productIdStr = new mongoose.Types.ObjectId(productId).toString();
      const filteredProduct = productsData[productIdStr];
      if (filteredProduct) {
        // Se for encontrado o produto filtrado, retornar somente ele
        res.json([filteredProduct]);
      } else {
        // Se o produto não for encontrado, retornar um array vazio
        res.json([]);
      }
    } else {
      // Converter o objeto em uma lista de produtos
      const productList = Object.values(productsData);
      res.json(productList);
    }
  } catch (error) {
    console.error('Erro ao gerar relatório de produtos:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório de produtos' });
  }
};

exports.getCommissionsReport = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    // Cria um objeto vazio para montar a consulta com os filtros
    const query = {};

    // Se foi fornecida uma data de início, adiciona o filtro
    if (startDate) {
      query.date = { $gte: new Date(startDate) };
    }

    // Se foi fornecida uma data de fim, adiciona o filtro
    if (endDate) {
      query.date = query.date || {};
      query.date.$lte = new Date(endDate);
    }

    // Se foi fornecido um ou mais IDs de usuário, adiciona o filtro
    if (userId) {
      const userIds = Array.isArray(userId) ? userId : [userId];
      query.user = { $in: userIds };
    }

    // Realiza a consulta no banco de dados
    const sales = await Sale.find(query).populate('customer user');

    // Monta o relatório de comissões
    const commissionReport = sales.map((sale) => {
      const { _id, date, customer, user, total } = sale;
      const { name } = customer;
      let { name: userName, commission } = user;
      if (commission===undefined) commission = 0.00;
      const comissionValue = (total * commission) / 100;

      return {
        saleId: _id,
        date,
        customer: { id: customer._id, name },
        user: { id: user._id, name: userName, commission },
        totalValue: total,
        comissionValue,
      };
    });

    res.json(commissionReport);
  } catch (error) {
    console.error('Erro ao gerar relatório de comissões:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório de comissões' });
  }
};