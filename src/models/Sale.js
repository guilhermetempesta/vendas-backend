const mongoose = require('mongoose');
const { Sequence } = require('./Sequence');

const saleSchema = new mongoose.Schema({
  code: { type: Number }, // atributo que será uma sequencia
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
  user: { type: mongoose.Types.ObjectId, ref: 'User' },
  canceledAt: Date,
  canceledBy: { type: mongoose.Types.ObjectId, ref: 'User' },
  comments: String
});

// Função de pré-salvar para gerar o autoincremento
saleSchema.pre('save', async function (next) {
  // console.log('pre')  
  const doc = this;
  
  if (!doc.code) {
    const sequenceName = 'saleCode';

    try {
      // Usando a função findOneAndUpdate para gerar o autoincremento
      const sequenceDoc = await Sequence.findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { seq: 1 } },
        { new: true }
      );
  
      // Defina o valor do campo 'code' com o valor atualizado da sequência
      doc.code = sequenceDoc.seq;
      next();
    } catch (error) {
      next(error);
    }  
  }   
});

const Sale = mongoose.model('Sale', saleSchema);

module.exports = { Sale };