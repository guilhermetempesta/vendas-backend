const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  date: Date,
  customer: { type: mongoose.Types.ObjectId, ref: 'Customer' }, 
  total: Number,
  items: [{
    product: { type: mongoose.Types.ObjectId, ref: 'Product' }, 
    quantity: Number,
    unitPrice: Number
  }]
})

// const itemSchema = new mongoose.Schema({
//   quantity: Number,
//   unitPrice: Number,
//   sale: { type: mongoose.Types.ObjectId, ref: 'Sale' }
// });

// const saleSchema = new mongoose.Schema({
//   date: Date,
//   total: Number,
//   items: [itemSchema]
// });

// const Sale = mongoose.model('Sale', saleSchema);
// const Item = mongoose.model('Item', itemSchema);

// module.exports = { Sale, Item };

const Sale = mongoose.model('Sale', saleSchema);

module.exports = { Sale };
