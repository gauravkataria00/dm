const mongoose = require("mongoose");

const advanceSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  purpose: String,
  status: {
    type: String,
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

advanceSchema.index({ createdAt: -1 });
advanceSchema.index({ clientId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Advance", advanceSchema);