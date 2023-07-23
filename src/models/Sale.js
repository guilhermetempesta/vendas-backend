const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  date: Date,
  customer: { type: mongoose.Types.ObjectId, ref: 'Customer' }, 
  subtotal: Number,
  discount: Number,
  addition: Number,
  total: Number,
  items: [{
    product: { type: mongoose.Types.ObjectId, ref: 'Product' }, 
    quantity: Number,
    unitPrice: Number,
    discount: Number,
    addition: Number,
    totalPrice: Number
  }],
  user: { type: mongoose.Types.ObjectId, ref: 'User' }
})

const Sale = mongoose.model('Sale', saleSchema);

module.exports = { Sale };
