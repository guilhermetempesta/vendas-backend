const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  name: String,
  active: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['super', 'admin', 'user'],
    default: 'user', 
  }, 
  imageUrl: String  
});

userSchema.pre('save', async function (next) {
  if (!this.isNew || !this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
