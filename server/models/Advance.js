const mongoose = require("mongoose");

const advanceSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TenantAdmin",
  },
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
advanceSchema.index({ tenantId: 1, createdAt: -1 });
advanceSchema.index({ tenantId: 1, adminId: 1, createdAt: -1 });

module.exports = mongoose.model("Advance", advanceSchema);