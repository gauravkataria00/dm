const mongoose = require("mongoose");

const consumerSaleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  consumerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consumer',
    required: [true, "Consumer ID is required"]
  },
  type: {
    type: String,
    enum: {
      values: ['milk', 'ghee', 'paneer', 'curd', 'other'],
      message: "Invalid product type"
    },
    default: 'milk'
  },
  litres: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [0.1, "Quantity must be greater than 0"]
  },
  rate: {
    type: Number,
    required: [true, "Rate is required"],
    min: [0.01, "Rate must be greater than 0"]
  },
  total: {
    type: Number,
    required: [true, "Total is required"],
    min: [0.01, "Total must be greater than 0"]
  },
  payment_status: {
    type: String,
    enum: {
      values: ['pending', 'paid', 'partial', 'cancelled'],
      message: "Invalid payment status"
    },
    default: 'pending'
  },
  sale_date: {
    type: Date,
    required: true,
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

// Pre-save hook to validate total
consumerSaleSchema.pre('save', function() {
  const calculatedTotal = Number((this.litres * this.rate).toFixed(2));
  if (Math.abs(calculatedTotal - this.total) > 0.01) {
    this.total = calculatedTotal;
  }
  this.updatedAt = new Date();
});

// Indexes
consumerSaleSchema.index({ consumerId: 1, sale_date: -1 });
consumerSaleSchema.index({ payment_status: 1 });
consumerSaleSchema.index({ sale_date: -1 });


module.exports = mongoose.model("ConsumerSale", consumerSaleSchema);