const mongoose = require('mongoose');
const { Sale } = require('../models/Sale');
const { User } = require('../models/User');
const { initializeSequence, currentDate } = require('../utils/commons');
const { startOfDay, endOfDay, parseISO } = require('date-fns');
const { timeZone, getFirstDayOfMonth, getEndOfToday } = require('../utils/dateHelpers');

exports.getSalesReport = async (req, res) => {
  try {
    const { initialDate, finalDate, userId, customerId } = req.query;
    const query = {};

    if (initialDate) {
      query.date = { $gte: new Date(`${initialDate}T00:00:00.000Z`) };
    }

    if (finalDate) {
      query.date.$lte = new Date(`${finalDate}T23:59:59.999Z`);
    }

    if (userId) {
      query.user = userId;
    }

    if (customerId) {
      query.customer = customerId;
    }

    const sales = await Sale.find(query).populate('customer user', '-password').populate('items.product');
    res.json(sales);
  } catch (error) {
    console.error('Erro ao buscar relatório de vendas:', error);
    res.status(500).json({ error: 'Erro ao buscar relatório de vendas' });
  }
};

exports.getCanceledSalesReport = async (req, res) => {
  try {
    const { initialDate, finalDate, userId, customerId } = req.query;
    const query = {};

    console.log(initialDate, finalDate)
    if (initialDate) {
      query.date = { $gte: new Date(`${initialDate}T00:00:00.000Z`) };
    }
    if (finalDate) {
      query.date.$lte = new Date(`${finalDate}T23:59:59.999Z`);
    }

    if ((!initialDate) && (!finalDate)) {
      query.canceledAt = { $ne: null }
    }

    if (userId) {
      query.user = userId;
    }

    if (customerId) {
      query.customer = customerId;
    }

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
        (productsData[productId].totalCost > 0 && productsData[productId].resultValue > 0) 
          ? ((productsData[productId].resultValue / productsData[productId].totalCost) * 100) : 0;
      productsData[productId].resultPercent = parseFloat(productsData[productId].resultPercent.toFixed(2));
      console.log(resultPercent)
      productsData[productId].subTotalSales = parseFloat(productsData[productId].subTotalSales.toFixed(2));
      productsData[productId].averagePrice = 
        (productsData[productId].soldAmount > 0 && productsData[productId].subTotalSales > 0) 
          ? (productsData[productId].subTotalSales / productsData[productId].soldAmount) : 0;
      productsData[productId].averagePrice = parseFloat(productsData[productId].averagePrice.toFixed(2)); 
      productsData[productId].totalDiscount = parseFloat(productsData[productId].totalDiscount.toFixed(2));
      productsData[productId].totalSales = parseFloat(productsData[productId].totalSales.toFixed(2));
      productsData[productId].unitCost = parseFloat(productsData[productId].unitCost.toFixed(2));
      productsData[productId].totalCost = parseFloat(productsData[productId].totalCost.toFixed(2));
      productsData[productId].resultValue = parseFloat(productsData[productId].resultValue.toFixed(2));
    }

    // Converter o objeto em uma lista de produtos
    const productList = Object.values(productsData);

    const summaryResultPercent = 
      (totalSales>0 && totalCost>0) ? ((totalSales - totalCost) / totalCost * 100) : 0.00;

    // Calcular o resumo
    const result = {
      products: productList,
      summary: {
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalSales: parseFloat(totalSales.toFixed(2)),
        resultValue: parseFloat((totalSales - totalCost).toFixed(2)),
        resultPercent: parseFloat(summaryResultPercent.toFixed(2)) 
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
    const query = {};

    if (initialDate) {
      query.date = { $gte: new Date(`${initialDate}T00:00:00.000Z`) };
    }

    if (finalDate) {
      query.date.$lte = new Date(`${finalDate}T23:59:59.999Z`);
    }

    if (userId) {
      const userIds = Array.isArray(userId) ? userId : [userId];
      query.user = { $in: userIds };
    }

    query.canceledAt = null;

    const sales = await Sale.find(query).populate('customer user');

    const commissionReport = {};

    sales.forEach((sale) => {
      const { _id, date, customer, user, total } = sale;
      const { name } = customer;
      const { _id: userId, name: userName, commission } = user;

      const comissionValue = (commission>0) ? ((total * commission) / 100) : 0;

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

exports.getSalesSummaryByMonth = async (req, res, next) => {
  try {
    const today = new Date();
    const timeZoneOffset = today.getTimezoneOffset(); // Obtém o offset do fuso horário em minutos
    
    const finalDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    finalDate.setHours(23 - timeZoneOffset / 60, 59, 59, 999); // Define a hora para o final do dia em Brasília
    
    const initialDate = new Date(finalDate);
    initialDate.setMonth(initialDate.getMonth() - 12);
    initialDate.setDate(1); // Define o dia como o primeiro dia do mês em Brasília
    initialDate.setHours(0, 0, 0, 0); // Define a hora para o início do dia em Brasília
    
    const monthsArray = [];
    let currentDate = new Date(initialDate);

    while (currentDate <= finalDate) {
      monthsArray.push({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    const pipeline = [
      {
        $match: {
          date: {
            $gte: initialDate,
            $lte: finalDate,
          },
          canceledAt: null,
        },
      },
      {
        $project: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          total: "$total",
          product: "$product",
          customer: "$customer",
          user: "$user",
        },
      },
      {
        $group: {
          _id: {
            year: "$year",
            month: "$month",
          },
          totalSales: { $sum: "$total" },
          salesQuantity: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id": 1,
        },
      },
    ];

    const salesByMonth = await Sale.aggregate(pipeline).exec();

    const result = {};

    for (const month of salesByMonth) {
      const monthYearKey = month._id.year + "-" + String(month._id.month).padStart(2, "0");
      const daysInMonth = (finalDate.getDate() - initialDate.getDate() + 1);

      result[monthYearKey] = {
        _id: monthYearKey,
        name: String(month._id.month).padStart(2, "0") + "/" + month._id.year,
        total: month.totalSales || 0,
        salesQuantity: month.salesQuantity || 0,
        averageSalesValue: (month.salesQuantity > 0) ? month.totalSales / month.salesQuantity : 0,
        topProducts: await getTopProducts(monthYearKey, 3),
        topCustomers: await getTopCustomers(monthYearKey, 3),
        topUsers: await getTopUsers(monthYearKey, 3),
      };
    }

    const filledMonths = monthsArray.map(async (month) => {
      const monthYearKey = month.year + "-" + String(month.month).padStart(2, "0");
      return result[monthYearKey] || {
        _id: monthYearKey,
        name: String(month.month).padStart(2, "0") + "/" + month.year,
        total: 0,
        salesQuantity: 0,
        averageSalesValue: 0,
        topProducts: [],
        topCustomers: [],
        topUsers: [],
      };
    });

    const filledMonthsData = await Promise.all(filledMonths);
    res.status(200).json(filledMonthsData);
  } catch (error) {
    console.error('Erro ao buscar resumo de vendas por mês:', error);
    next(error);
  }
};

async function getTopProducts(monthYearKey, limit) {
  const pipeline = [
    {
      $match: {
        date: {
          $gte: new Date(monthYearKey + "-01"),
          $lte: new Date(monthYearKey + "-31"),
        },
        canceledAt: null,
      },
    },
    {
      $unwind: "$items",
    },
    {
      $group: {
        _id: "$items.product",
        totalAmount: { $sum: "$items.quantity" },
      },
    },
    {
      $lookup: {
        from: "products", // Substitua "products" pelo nome da sua coleção de produtos
        localField: "_id",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $unwind: "$productDetails",
    },
    {
      $sort: { totalAmount: -1 },
    },
    {
      $limit: limit || 1,
    },
    {
      $project: {
        name: "$productDetails.name",
        amount: "$totalAmount",
      },
    },
  ];

  const topProducts = await Sale.aggregate(pipeline).exec();
  return topProducts;
}

async function getTopCustomers(monthYearKey, limit) {
  const pipeline = [
    {
      $match: {
        date: {
          $gte: new Date(monthYearKey + "-01"),
          $lte: new Date(monthYearKey + "-31"),
        },
        canceledAt: null,
      },
    },
    {
      $group: {
        _id: "$customer",
        totalAmount: { $sum: "$total" },
      },
    },
    {
      $lookup: {
        from: "customers", // Substitua "customers" pelo nome da sua coleção de clientes
        localField: "_id",
        foreignField: "_id",
        as: "customerDetails",
      },
    },
    {
      $unwind: "$customerDetails",
    },
    {
      $sort: { totalAmount: -1 },
    },
    {
      $limit: limit || 1,
    },
    {
      $project: {
        name: "$customerDetails.name",
        total: "$totalAmount",
      },
    },
  ];

  const topCustomers = await Sale.aggregate(pipeline).exec();
  return topCustomers;
}


async function getTopUsers(monthYearKey, limit) {
  const pipeline = [
    {
      $match: {
        date: {
          $gte: new Date(monthYearKey + "-01"),
          $lte: new Date(monthYearKey + "-31"),
        },
        canceledAt: null,
      },
    },
    {
      $group: {
        _id: "$user",
        totalAmount: { $sum: "$total" },
      },
    },
    {
      $lookup: {
        from: "users", // Substitua "users" pelo nome da sua coleção de usuários
        localField: "_id",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: "$userDetails",
    },
    {
      $sort: { totalAmount: -1 },
    },
    {
      $limit: limit || 1,
    },
    {
      $project: {
        name: "$userDetails.name",
        amount: "$totalAmount",
      },
    },
  ];

  const topUsers = await Sale.aggregate(pipeline).exec();
  return topUsers;
}

exports.getSalesGroupedByDay = async (req, res, next) => {
  try {
    if (!req.query.initialDate || !req.query.finalDate) {
      const error = new Error('Período não informado.');
      error.statusCode = 400;
      throw error;
    }

    const initialDate = startOfDay(parseISO(req.query.initialDate));
    const finalDate = endOfDay(parseISO(req.query.finalDate));

    const pipeline = [
      {
        $match: {
          date: {
            $gte: initialDate,
            $lte: finalDate
          },
          canceledAt: null
        }
      },
      {
        $lookup: {
          from: 'customers', // Nome da coleção de Customer
          localField: 'customer',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $lookup: {
          from: 'users', // Nome da coleção de User
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          totalSales: { $sum: '$total' },
          totalAmount: { $sum: 1 }, // Conta o número de vendas
          sales: {
            $push: {
              code: '$code',
              total: '$total',
              customer: {
                name: { $arrayElemAt: ['$customer.name', 0] } // Pega o primeiro elemento do array de customers
              },
              user: {
                name: { $arrayElemAt: ['$user.name', 0] } // Pega o primeiro elemento do array de users
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          totalSales: 1,
          totalAmount: 1,
          sales: 1
        }
      },
      {
        $addFields: {
          _id: {
            $dateToString: { format: '%d/%m/%Y', date: '$date' }
          }
        }
      },
      {
        $sort: {
          date: 1
        }
      }
    ];

    const salesByDay = await Sale.aggregate(pipeline).exec();

    res.status(200).json(salesByDay);
  } catch (error) {
    console.error('Erro ao buscar vendas agrupadas por dia:', error);
    next(error);
  }
};

exports.getUserSalesReport = async (req, res) => {
  try {
    const { initialDate, finalDate, customerId } = req.query;
    const query = {};

    query.user = req.user._id;

    if (initialDate) {
      query.date = { $gte: new Date(`${initialDate}T00:00:00.000Z`) };
    }

    if (finalDate) {
      query.date.$lte = new Date(`${finalDate}T23:59:59.999Z`);
    }

    if (customerId) {
      query.customer = customerId;
    }

    const sales = await Sale.find(query).populate('customer user', '-password').populate('items.product');
    console.log(sales)
    res.json(sales);
  } catch (error) {
    console.error('Erro ao buscar relatório de vendas:', error);
    res.status(500).json({ error: 'Erro ao buscar relatório de vendas' });
  }
};

exports.getUserSalesGroupedByDay = async (req, res, next) => {
  try {
    if (!req.query.initialDate || !req.query.finalDate) {
      const error = new Error('Período não informado.');
      error.statusCode = 400;
      throw error;
    }

    const initialDate = startOfDay(parseISO(req.query.initialDate));
    const finalDate = endOfDay(parseISO(req.query.finalDate));
    const userId = req.user._id;
    console.log(userId);

    const pipeline = [
      {
        $match: {
          date: {
            $gte: initialDate,
            $lte: finalDate
          },
          canceledAt: null,
          user: userId
        }
      },
      {
        $lookup: {
          from: 'customers', // Nome da coleção de Customer
          localField: 'customer',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $lookup: {
          from: 'users', // Nome da coleção de User
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          totalSales: { $sum: '$total' },
          totalAmount: { $sum: 1 }, // Conta o número de vendas
          sales: {
            $push: {
              code: '$code',
              total: '$total',
              customer: {
                name: { $arrayElemAt: ['$customer.name', 0] } // Pega o primeiro elemento do array de customers
              },
              user: {
                name: { $arrayElemAt: ['$user.name', 0] } // Pega o primeiro elemento do array de users
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          totalSales: 1,
          totalAmount: 1,
          sales: 1
        }
      },
      {
        $addFields: {
          _id: {
            $dateToString: { format: '%d/%m/%Y', date: '$date' }
          }
        }
      },
      {
        $sort: {
          date: 1
        }
      }
    ];

    const salesByDay = await Sale.aggregate(pipeline).exec();

    res.status(200).json(salesByDay);
  } catch (error) {
    console.error('Erro ao buscar vendas agrupadas por dia:', error);
    next(error);
  }
};