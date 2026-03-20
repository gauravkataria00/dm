const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, "Client ID is required"]
  },
  startDate: {
    type: Date,
    required: [true, "Start date is required"]
  },
  endDate: {
    type: Date,
    required: [true, "End date is required"]
  },
  totalLitres: {
    type: Number,
    min: [0, "Total litres cannot be negative"],
    default: 0
  },
  totalAmount: {
    type: Number,
    min: [0, "Total amount cannot be negative"],
    default: 0
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'completed', 'cancelled'],
      message: "Invalid settlement status"
    },
    default: 'pending'
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

// Pre-save hook to validate dates
settlementSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    throw new Error('End date must be after start date');
  }
  this.updatedAt = new Date();
  next();
});

// Indexes
settlementSchema.index({ clientId: 1, status: 1 });
settlementSchema.index({ createdAt: -1 });
settlementSchema.index({ status: 1 });

module.exports = mongoose.model("Settlement", settlementSchema);