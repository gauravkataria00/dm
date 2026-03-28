const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalLitres: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

settlementSchema.index({ createdAt: -1 });
settlementSchema.index({ clientId: 1, status: 1, createdAt: -1 });
settlementSchema.index({ clientId: 1, startDate: -1, endDate: -1 });
settlementSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model("Settlement", settlementSchema);