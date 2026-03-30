const mongoose = require("mongoose");

const milkEntrySchema = new mongoose.Schema({
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
  shift: {
    type: String,
    enum: ["morning", "evening"],
    default: "morning",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

milkEntrySchema.index({ createdAt: -1 });
milkEntrySchema.index({ clientId: 1, createdAt: -1 });
milkEntrySchema.index({ type: 1, createdAt: -1 });
milkEntrySchema.index({ tenantId: 1, createdAt: -1 });
milkEntrySchema.index({ tenantId: 1, adminId: 1, createdAt: -1 });

module.exports = mongoose.model("MilkEntry", milkEntrySchema);