const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  address: String,
  latitude: String,
  longitude: String,
  status: {
    type: String,
    default: 'active',
  },
  register_at: {
    type: Date,
    default: Date.now,
  },
  token: String,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
