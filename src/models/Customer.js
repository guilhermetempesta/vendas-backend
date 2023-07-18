const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  code: String,
  comment: String,
  active: {
    type: Boolean,
    default: true
  }
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
