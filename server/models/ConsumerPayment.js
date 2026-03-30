const mongoose = require("mongoose");

const consumerPaymentSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TenantAdmin",
  },
  consumerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consumer',
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
  payment_method: {
    type: String,
    default: 'cash'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

consumerPaymentSchema.index({ tenantId: 1, createdAt: -1 });
consumerPaymentSchema.index({ tenantId: 1, adminId: 1, createdAt: -1 });

module.exports = mongoose.model("ConsumerPayment", consumerPaymentSchema);