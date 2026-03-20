const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, "Inventory type is required"],
    enum: {
      values: ['cow_milk', 'buffalo_milk', 'ghee', 'paneer'],
      message: "Invalid inventory type"
    },
    trim: true
  },
  opening_stock: {
    type: Number,
    min: [0, "Opening stock cannot be negative"],
    default: 0
  },
  received: {
    type: Number,
    min: [0, "Received cannot be negative"],
    default: 0
  },
  sold: {
    type: Number,
    min: [0, "Sold cannot be negative"],
    default: 0
  },
  closing_stock: {
    type: Number,
    min: [0, "Closing stock cannot be negative"],
    default: 0
  },
  date: {
    type: Date,
    required: [true, "Date is required"],
    default: Date.now
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

// Pre-save hook to validate and calculate closing stock
inventorySchema.pre('save', function(next) {
  // Validate: closing_stock = opening_stock + received - sold
  const calculatedClosing = this.opening_stock + this.received - this.sold;
  if (calculatedClosing !== this.closing_stock) {
    this.closing_stock = calculatedClosing;
  }
  this.updatedAt = new Date();
  next();
});

// Unique index on type and date
inventorySchema.index({ type: 1, date: -1 }, { unique: false });
inventorySchema.index({ date: -1 });

module.exports = mongoose.model("Inventory", inventorySchema);