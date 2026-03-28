const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, lowercase: true, trim: true },
  monthlyCharge: { type: Number, default: 0 },
  nextDueDate: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

tenantSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Tenant", tenantSchema);