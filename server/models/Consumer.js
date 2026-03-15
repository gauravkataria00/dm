const mongoose = require("mongoose");

const consumerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: String,
  address: String,
  type: {
    type: String,
    default: 'regular'
  },
  credit_limit: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Consumer", consumerSchema);