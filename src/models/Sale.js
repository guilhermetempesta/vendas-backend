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

saleSchema.methods.prorate = function () {
  let totalDiscountApplied = 0;
  let totalAdditionApplied = 0;

  // faz o rateio do desconto e do acréscimo para os itens
  this.items.forEach((item) => {
    const itemFullPrice = item.totalPrice;
    console.log('itemFullPrice: '+ itemFullPrice);

    let itemDiscount = this.discount * itemFullPrice / this.subtotal;
    let itemAddition = this.addition * itemFullPrice / this.subtotal;

    // calcula desconto
    if (itemDiscount > 0 ) {
      itemDiscount = parseFloat(itemDiscount.toFixed(2));
      console.log('desconto: ' + itemDiscount);
      item.discount = itemDiscount;
      item.totalPrice -= item.discount;
      totalDiscountApplied += item.discount;  
    }
    
    // calcula acrescimo
    if (itemAddition > 0) {
      itemAddition = parseFloat(itemAddition.toFixed(2));
      console.log('acrescimo: ' + itemAddition);
      item.addition = itemAddition;
      item.totalPrice += item.addition;
      totalAdditionApplied += item.addition;
    }            
  });

  // verifica se há diferença de arredondamento no desconto
  console.log(totalDiscountApplied, this.discount);   
  if (totalDiscountApplied < this.discount) {
    const remainingDiscount = this.discount - totalDiscountApplied;
    this.items[0].discount += remainingDiscount;
    this.items[0].totalPrice -= remainingDiscount;
  } else if (totalDiscountApplied > this.discount) {
    const excessDiscount = totalDiscountApplied - this.discount;
    const lastIndex = this.items.length - 1;
    this.items[lastIndex].discount -= excessDiscount;
    this.items[lastIndex].totalPrice += excessDiscount;
  }

  // verifica se há diferença de arredondamento no acréscimo
  console.log(totalAdditionApplied, this.addition);   
  if (totalAdditionApplied < this.addition) {
    const remainingAddition = this.addition - totalAdditionApplied;
    this.items[0].addition += remainingAddition;
    this.items[0].totalPrice += remainingAddition;
  } else if (totalAdditionApplied > this.addition) {
    const excessDiscount = totalAdditionApplied - this.addition;
    const lastIndex = this.items.length - 1;
    this.items[lastIndex].addition -= excessDiscount;
    this.items[lastIndex].totalPrice -= excessDiscount;
  }
};

const Sale = mongoose.model('Sale', saleSchema);

module.exports = { Sale };