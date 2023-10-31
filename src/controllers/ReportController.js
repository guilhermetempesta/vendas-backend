const mongoose = require('mongoose');
const { Sale } = require('../models/Sale');
const { User } = require('../models/User');
const { initializeSequence, currentDate } = require('../utils/commons');
const { startOfDay, endOfDay, parseISO } = require('date-fns');

// Método para buscar vendas por período, usuário, cliente e produtos
exports.getSalesReport = async (req, res) => {
  try {
    // Recebe os parâmetros do filtro da requisição
    const { initialDate, finalDate, userId, customerId } = req.query;

    // Cria um objeto vazio para montar a consulta com os filtros
    const query = {};

    // Se foi fornecida uma data de início, adiciona o filtro
    if (initialDate) {
      query.date = { $gte: new Date(initialDate) };
    }

    // Se foi fornecida uma data de fim, adiciona o filtro
    if (finalDate) {
      // Incrementa um dia na data de fim para incluir as vendas do último dia
      query.date.$lte = new Date(finalDate);
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

exports.getCanceledSalesReport = async (req, res) => {
  try {
    // Recebe os parâmetros do filtro da requisição
    const { initialDate, finalDate, userId, customerId } = req.query;

    // Cria um objeto vazio para montar a consulta com os filtros
    const query = {};

    // Se foi fornecida uma data de início, adiciona o filtro
    if (initialDate) {
      query.canceledAt = { $gte: new Date(initialDate) };
    }

    // Se foi fornecida uma data de fim, adiciona o filtro
    if (finalDate) {
      // Incrementa um dia na data de fim para incluir as vendas do último dia
      query.canceledAt.$lte = new Date(finalDate);
    }

    if ((!initialDate) && (!finalDate)) {
      query.canceledAt = { $ne: null }
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
    const Product = require('../models/Product');
    console.log(req.query)

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

    if (req.query.product) {
      pipeline = [
        ...pipeline,
        {
          $lookup: {
            from: 'products', // Nome da coleção de Product
            localField: 'product',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $unwind: '$product'
        },
        {
          $match: {
            'product.name': new RegExp(req.query.product, 'i')
          }
        }
      ];
    }

    console.log(pipeline);

    const sales = await Sale.aggregate(pipeline).exec();

    // Preencha os campos relacionados após a execução da agregação
    await Sale.populate(sales, ['customer','items.product', { path: 'user', select: 'email name' }]);

    // Crie um objeto para armazenar os dados do relatório
    const productsData = {};

    // Inicialize os totais para o resumo
    let totalCost = 0;
    let totalSales = 0;

    // Adicione todos os produtos ao objeto, mesmo os não vendidos
    const allProducts = await Product.find();
    allProducts.forEach((product) => {
      const productIdStr = product._id.toString();
      productsData[productIdStr] = {
        id: product._id,
        name: product.name,
        soldAmount: 0,
        averagePrice: 0,
        subTotalSales: 0,
        totalDiscount: 0,
        totalSales: 0,
        unitCost: product.cost,
        totalCost: 0,
        resultValue: 0,
        resultPercent: 0,
      };
    });

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const productIdStr = item.product._id.toString();
        productsData[productIdStr].soldAmount += item.quantity;
        productsData[productIdStr].subTotalSales += item.quantity * item.unitPrice;
        productsData[productIdStr].totalDiscount += (item.discount > 0) ? item.discount : 0;
        productsData[productIdStr].totalSales += item.totalPrice;
        productsData[productIdStr].totalCost += item.quantity * item.product.cost;
        productsData[productIdStr].resultValue = productsData[productIdStr].totalSales - productsData[productIdStr].totalCost;

        // Atualize os totais do resumo
        totalCost += item.quantity * item.product.cost;
        totalSales += item.totalPrice;
      });
    });

    // Calcular o percentual de lucro corretamente
    for (const productId in productsData) {
      productsData[productId].resultPercent = 
        (productsData[productId].totalCost > 0) ? (productsData[productId].resultValue / productsData[productId].totalCost) * 100 : 0;
      productsData[productId].resultPercent = parseFloat(productsData[productId].resultPercent.toFixed(2));
      productsData[productId].subTotalSales = parseFloat(productsData[productId].subTotalSales.toFixed(2));
      productsData[productId].averagePrice = 
        (productsData[productId].soldAmount) ? productsData[productId].subTotalSales / productsData[productId].soldAmount : 0;
      productsData[productId].averagePrice = parseFloat(productsData[productId].averagePrice.toFixed(2)); 
      productsData[productId].totalDiscount = parseFloat(productsData[productId].totalDiscount.toFixed(2));
      productsData[productId].totalSales = parseFloat(productsData[productId].totalSales.toFixed(2));
      productsData[productId].unitCost = parseFloat(productsData[productId].unitCost.toFixed(2));
      productsData[productId].totalCost = parseFloat(productsData[productId].totalCost.toFixed(2));
      productsData[productId].resultValue = parseFloat(productsData[productId].resultValue.toFixed(2));
    }

    // Converter o objeto em uma lista de produtos
    const productList = Object.values(productsData);

    // Calcular o resumo
    const result = {
      products: productList,
      summary: {
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalSales: parseFloat(totalSales.toFixed(2)),
        resultValue: parseFloat((totalSales - totalCost).toFixed(2)),
        resultPercent: parseFloat((((totalSales - totalCost) / totalCost) * 100).toFixed(2)),
      },
    };
    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar relatório de produtos:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório de produtos' });
  }
};

exports.getCommissionsReport = async (req, res) => {
  try {
    const { initialDate, finalDate, userId } = req.query;

    // Cria um objeto vazio para montar a consulta com os filtros
    const query = {};

    // Se foi fornecida uma data de início, adiciona o filtro
    if (initialDate) {
      query.date = { $gte: new Date(initialDate) };
    }

    // Se foi fornecida uma data de fim, adiciona o filtro
    if (finalDate) {
      query.date = query.date || {};
      query.date.$lte = new Date(finalDate);
    }

    // Se foi fornecido um ou mais IDs de usuário, adiciona o filtro
    if (userId) {
      const userIds = Array.isArray(userId) ? userId : [userId];
      query.user = { $in: userIds };
    }

    // Realiza a consulta no banco de dados
    const sales = await Sale.find(query).populate('customer user');

    // Monta o relatório de comissões
    const commissionReport = {};

    sales.forEach((sale) => {
      const { _id, date, customer, user, total } = sale;
      const { name } = customer;
      const { _id: userId, name: userName, commission } = user;

      const comissionValue = (total * commission) / 100;

      if (!commissionReport[userId]) {
        commissionReport[userId] = {
          user: { id: userId, name: userName, commission },
          sales: [],
          totalSales: 0,
          totalComission: 0,
        };
      }

      commissionReport[userId].sales.push({
        saleId: _id,
        date,
        customer: { id: customer._id, name },
        totalValue: total,
        comissionValue,
      });

      commissionReport[userId].totalSales += total;
      commissionReport[userId].totalComission += comissionValue;
    });

    const result = Object.values(commissionReport);

    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar relatório de comissões:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório de comissões' });
  }
};
