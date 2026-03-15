const mongoose = require("mongoose");

const consumerSaleSchema = new mongoose.Schema({
  consumerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consumer',
    required: true
  },
  type: {
    type: String,
    default: 'milk'
  },
  litres: {
    type: Number,
    required: true
  },
  rate: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  payment_status: {
    type: String,
    default: 'pending'
  },
  sale_date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ConsumerSale", consumerSaleSchema);