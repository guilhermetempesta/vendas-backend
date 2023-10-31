const { Sale } = require('../models/Sale');
const { format } = require('date-fns-tz');
const { timeZone, getFirstDayOfMonth, getEndOfToday } = require('../utils/dateHelpers');

exports.getSalesCurrentMonth = async (req, res, next) => {
  try {
    const initialDate = getFirstDayOfMonth();
    const finalDate = getEndOfToday();

    console.log(format(initialDate, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", { timeZone }));
    console.log(format(finalDate, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", { timeZone }));

    // Crie um array com todas as datas entre initialDate e finalDate
    const allDates = [];
    let currentDate = new Date(initialDate);
    while (currentDate <= finalDate) {
      allDates.push({
        _id: format(currentDate, "dd/MM/yyyy"),
        totalSales: 0,
        totalAmount: 0
      });
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }

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
        $addFields: {
          formattedDate: {
            $dateToString: {
              format: '%d/%m/%Y',
              date: '$date',
              timezone: timeZone
            }
          }
        }
      },
      {
        $group: {
          _id: '$formattedDate',
          totalSales: { $sum: 1 },
          totalAmount: { $sum: '$total' }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ];

    const salesByDay = await Sale.aggregate(pipeline).exec();

    // Realize a junção dos resultados com as datas completas
    const mergedResults = allDates.map(date => {
      const matchingSale = salesByDay.find(sale => sale._id === date._id);
      return matchingSale || date;
    });

    res.status(200).json(mergedResults);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    next(error);
  }
};


exports.getTotalSalesCurrentMonth = async (req, res, next) => {
  try {
    const initialDate = getFirstDayOfMonth();
    const finalDate = getEndOfToday();

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
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          salesQuantity: { $sum: 1 }
        }
      }
    ];

    const result = await Sale.aggregate(pipeline).exec();

    if (result.length > 0) {
      const totalSales = result[0].totalSales || 0;
      const salesQuantity = result[0].salesQuantity || 0;
      const salesAverage = salesQuantity > 0 ? totalSales / salesQuantity : 0;

      // Calcula a média de vendas por dia
      const daysInMonth = (finalDate.getDate() - initialDate.getDate() + 1);
      const salesAveragePerDay = daysInMonth > 0 ? totalSales / daysInMonth : 0;

      res.status(200).json({
        totalSales,
        salesQuantity,
        salesAverage,
        salesAveragePerDay
      });
    } else {
      res.status(200).json({
        totalSales: 0,
        salesQuantity: 0,
        salesAverage: 0,
        salesAveragePerDay: 0
      });
    }
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    next(error);
  }
};

exports.getLastSales = async (req, res, next) => {
  try {
    const initialDate = getFirstDayOfMonth();
    const finalDate = getEndOfToday();

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
        $sort: {
          date: -1 // Ordena por data decrescente para pegar as mais recentes primeiro
        }
      },
      {
        $limit: 10 // Limita a 10 vendas mais recentes
      },
      {
        $lookup: {
          from: 'customers', // Substitua 'customers' pelo nome da coleção de clientes
          localField: 'customer',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: '$customer' // Desdobra o array resultante do $lookup
      },
      {
        $lookup: {
          from: 'users', 
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
    ];

    const lastSales = await Sale.aggregate(pipeline).exec();

    res.status(200).json(lastSales);
  } catch (error) {
    console.error('Erro ao buscar as últimas vendas:', error);
    next(error);
  }
};

exports.getSalesByMonth = async (req, res, next) => {
  try {
    // Defina a data inicial para 12 meses atrás a partir da data atual
    const initialDate = getEndOfToday();
    initialDate.setMonth(initialDate.getMonth() - 11);

    // Data final é o último dia do mês atual
    const finalDate = getEndOfToday();

    // Array com os últimos 12 meses, incluindo o mês atual
    const monthsArray = [];
    let currentDate = new Date(initialDate);

    while (currentDate <= finalDate) {
      monthsArray.push({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1 // Janeiro é 0, então adicionamos 1
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

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
        $project: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          total: "$total"
        }
      },
      {
        $group: {
          _id: {
            year: "$year",
            month: "$month"
          },
          totalSales: { $sum: "$total" }
        }
      },
      {
        $project: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: 1
                }
              }
            }
          },
          name: {
            $dateToString: {
              format: "%m/%Y",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: 1
                }
              }
            }
          },
          total: "$totalSales"
        }
      },
      {
        $sort: {
          "_id": 1
        }
      },
      {
        $group: {
          _id: null,
          salesByMonth: {
            $push: {
              _id: "$_id",
              name: "$name",
              total: "$total"
            }
          }
        }
      }
    ];

    const salesByMonth = await Sale.aggregate(pipeline).exec();

    // Preencha os meses ausentes com valores zerados
    if (salesByMonth.length > 0) {
      const result = salesByMonth[0].salesByMonth;
      const filledMonths = [];

      for (const month of monthsArray) {
        const foundMonth = result.find((item) => item._id === month.year + "-" + String(month.month).padStart(2, "0"));
        if (foundMonth) {
          filledMonths.push(foundMonth);
        } else {
          filledMonths.push({
            _id: month.year + "-" + String(month.month).padStart(2, "0"),
            name: String(month.month).padStart(2, "0") + "/" + month.year,
            total: 0
          });
        }
      }

      res.status(200).json(filledMonths);
    } else {
      // Se não houver vendas nos últimos 12 meses, retorne todos os meses com valores zerados
      const filledMonths = monthsArray.map((month) => ({
        _id: month.year + "-" + String(month.month).padStart(2, "0"),
        name: String(month.month).padStart(2, "0") + "/" + month.year,
        total: 0
      }));
      res.status(200).json(filledMonths);
    }
  } catch (error) {
    console.error('Erro ao buscar vendas por mês:', error);
    next(error);
  }
};

exports.getSalesBySeller = async (req, res, next) => {
  try {
    // Defina a data inicial para 12 meses atrás a partir da data atual
    const initialDate = getEndOfToday();
    initialDate.setMonth(initialDate.getMonth() - 11);

    // Data final é o último dia do mês atual
    const finalDate = getEndOfToday();

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
          from: 'users', // Substitua 'users' pelo nome da coleção de usuários
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $group: {
          _id: '$user._id',
          name: { $first: '$user.name' },
          total: { $sum: '$total' }
        }
      },
      {
        $sort: {
          total: -1
        }
      }
    ];

    const salesBySeller = await Sale.aggregate(pipeline).exec();

    if (salesBySeller.length > 5) {
      // Agrupar os vendedores com maior percentual
      const topSellers = salesBySeller.slice(0, 4);
      const remainingSellers = salesBySeller.slice(4);

      // Calcular o total das vendas dos vendedores restantes
      const totalRemainingSales = remainingSellers.reduce((total, seller) => total + seller.total, 0);

      // Adicionar o vendedor "Outros" com o total acumulado
      const othersSeller = {
        _id: 'others',
        name: 'Outros',
        total: totalRemainingSales,
      };

      // Adicionar o vendedor "Outros" à lista de vendedores
      topSellers.push(othersSeller);

      res.status(200).json(topSellers);
    } else {
      // Calcula o total de vendas para obter o percentual
      const totalSales = salesBySeller.reduce((total, seller) => total + seller.total, 0);

      // Calcula o percentual para cada vendedor
      for (const seller of salesBySeller) {
        seller.percent = (seller.total / totalSales) * 100;
      }

      res.status(200).json(salesBySeller);
    }
  } catch (error) {
    console.error('Erro ao buscar vendas por vendedor:', error);
    next(error);
  }
};

