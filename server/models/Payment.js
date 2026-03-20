const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, "Client ID is required"]
  },
  settlementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Settlement'
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [0.01, "Amount must be greater than 0"]
  },
  type: {
    type: String,
    required: [true, "Payment type is required"],
    enum: {
      values: ['settlement_payment', 'advance_given', 'advance_repaid', 'adjustment'],
      message: "Invalid payment type"
    }
  },
  date: {
    type: Date,
    required: [true, "Payment date is required"],
    default: Date.now
  },
  notes: {
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

// Pre-save hook
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for faster queries
paymentSchema.index({ clientId: 1, date: -1 });
paymentSchema.index({ date: -1 });
paymentSchema.index({ type: 1 });

module.exports = mongoose.model("Payment", paymentSchema);