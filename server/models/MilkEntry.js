const mongoose = require("mongoose");

const milkEntrySchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  type: {
    type: String,
    required: true
  },
  litres: {
    type: Number,
    required: true
  },
  fat: {
    type: Number,
    required: true
  },
  snf: {
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("MilkEntry", milkEntrySchema);