const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  name: String,
  phone: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Client", clientSchema);