const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  opening_stock: {
    type: Number,
    default: 0
  },
  received: {
    type: Number,
    default: 0
  },
  sold: {
    type: Number,
    default: 0
  },
  closing_stock: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Inventory", inventorySchema);