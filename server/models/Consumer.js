const mongoose = require("mongoose");

const consumerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Consumer name is required"],
    minlength: [2, "Name must be at least 2 characters"],
    trim: true
  },
  phone: {
    type: String,
    required: [true, "Phone is required"],
    match: [/^\d{10}$/, "Phone must be 10 digits"],
    trim: true
  },
  address: {
    type: String,
    trim: true,
    default: ""
  },
  type: {
    type: String,
    enum: {
      values: ['regular', 'wholesale', 'restaurant', 'dairy'],
      message: "Invalid consumer type"
    },
    default: 'regular'
  },
  credit_limit: {
    type: Number,
    min: [0, "Credit limit cannot be negative"],
    default: 0
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

// Pre-save hook
consumerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes
consumerSchema.index({ phone: 1 });
consumerSchema.index({ type: 1 });

module.exports = mongoose.model("Consumer", consumerSchema);