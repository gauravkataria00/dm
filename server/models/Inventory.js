const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
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

inventorySchema.index({ date: -1, createdAt: -1 });
inventorySchema.index({ type: 1, date: -1 });
inventorySchema.index({ tenantId: 1, date: -1, createdAt: -1 });

module.exports = mongoose.model("Inventory", inventorySchema);