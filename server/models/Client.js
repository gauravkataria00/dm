const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
  name: String,
  phone: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

clientSchema.index({ createdAt: -1 });
clientSchema.index({ phone: 1 });
clientSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model("Client", clientSchema);