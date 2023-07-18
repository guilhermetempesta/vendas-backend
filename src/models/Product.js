const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  reference: String,
  name: String,
  price: Number,
  cost: Number,
  description: String,
  active: {
    type: Boolean,
    default: true
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
