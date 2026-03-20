const mongoose = require("mongoose");

const consumerPaymentSchema = new mongoose.Schema({
  consumerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consumer',
    required: [true, "Consumer ID is required"]
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [0.01, "Amount must be greater than 0"]
  },
  date: {
    type: Date,
    required: [true, "Payment date is required"],
    default: Date.now
  },
  payment_method: {
    type: String,
    enum: {
      values: ['cash', 'check', 'transfer', 'online', 'credit'],
      message: "Invalid payment method"
    },
    default: 'cash'
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
consumerPaymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes
consumerPaymentSchema.index({ consumerId: 1, date: -1 });
consumerPaymentSchema.index({ date: -1 });

module.exports = mongoose.model("ConsumerPayment", consumerPaymentSchema);