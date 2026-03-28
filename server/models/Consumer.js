const mongoose = require("mongoose");

const consumerSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
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

consumerSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model("Consumer", consumerSchema);