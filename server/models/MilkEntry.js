const mongoose = require("mongoose");

const milkEntrySchema = new mongoose.Schema({
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
  type: {
    type: String,
    required: [true, "Milk type is required"],
    trim: true,
    default: "Standard"
  },
  litres: {
    type: Number,
    required: [true, "Litres is required"],
    min: [0.1, "Litres must be greater than 0"],
    default: 0
  },
  fat: {
    type: Number,
    required: [true, "Fat percentage is required"],
    min: [0, "Fat must be between 0 and 8"],
    max: [8, "Fat must be between 0 and 8"],
    default: 3.5
  },
  snf: {
    type: Number,
    required: [true, "SNF is required"],
    min: [0, "SNF must be between 0 and 10"],
    max: [10, "SNF must be between 0 and 10"],
    default: 8.0
  },
  rate: {
    type: Number,
    required: [true, "Rate is required"],
    min: [0, "Rate must be greater than 0"],
    default: 0
  },
  total: {
    type: Number,
    required: [true, "Total amount is required"],
    min: [0, "Total must be greater than 0"],
    default: 0
  },
  shift: {
    type: String,
    enum: {
      values: ["morning", "evening"],
      message: "Shift must be either 'morning' or 'evening'"
    },
    default: "morning",
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

// Pre-save hook to validate and calculate total
milkEntrySchema.pre('save', function() {
  // Validate total = litres * rate
  const calculatedTotal = Number((this.litres * this.rate).toFixed(2));
  if (Math.abs(calculatedTotal - this.total) > 0.01) {
    this.total = calculatedTotal;
  }
  this.updatedAt = new Date();
});

// Compound index for faster queries
milkEntrySchema.index({ clientId: 1, createdAt: -1 });
milkEntrySchema.index({ createdAt: -1 });

module.exports = mongoose.model("MilkEntry", milkEntrySchema);