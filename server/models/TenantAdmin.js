const mongoose = require("mongoose");

const tenantAdminSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  displayPassword: { type: String, default: "" },
  passwordSalt: { type: String, default: "" },
  passwordHash: { type: String, required: true },
  mustChangePassword: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

tenantAdminSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model("TenantAdmin", tenantAdminSchema);