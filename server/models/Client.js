const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Client name is required"],
    minlength: [2, "Name must be at least 2 characters long"],
    trim: true,
    text: true // for text search
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    match: [/^\d{10}$/, "Phone number must be 10 digits"],
    trim: true
  },
  address: {
    type: String,
    trim: true,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Pre-save hook to validate and sanitize
clientSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster queries
clientSchema.index({ phone: 1 });
clientSchema.index({ name: 'text' });

module.exports = mongoose.model("Client", clientSchema);