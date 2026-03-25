const mongoose = require("mongoose");

const advanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, "Client ID is required"]
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [0.01, "Amount must be greater than 0"]
  },
  date: {
    type: Date,
    required: [true, "Advance date is required"],
    default: Date.now
  },
  purpose: {
    type: String,
    trim: true,
    default: ""
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'completed', 'cancelled'],
      message: "Invalid status"
    },
    default: 'active'
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
advanceSchema.pre('save', function() {
  this.updatedAt = new Date();
});

// Indexes
advanceSchema.index({ clientId: 1, date: -1 });
advanceSchema.index({ status: 1 });

module.exports = mongoose.model("Advance", advanceSchema);