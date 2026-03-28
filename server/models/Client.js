const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  name: String,
  phone: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

clientSchema.index({ createdAt: -1 });
clientSchema.index({ phone: 1 });

module.exports = mongoose.model("Client", clientSchema);