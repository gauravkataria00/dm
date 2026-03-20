const express = require("express");
const router = express.Router();
const ConsumerPayment = require("../models/ConsumerPayment");

// Get all consumer payments
router.get("/", async (req, res) => {
  try {
    let payments = await ConsumerPayment.find()
      .populate('consumerId', 'name phone')
      .sort({ createdAt: -1 });
    
    // Remove broken references
    payments = payments.filter(payment => payment.consumerId !== null);
    
    // Safe response format
    const data = payments.map(payment => ({
      id: payment._id,
      _id: payment._id,
      amount: payment.amount,
      date: payment.date,
      payment_method: payment.payment_method,
      notes: payment.notes,
      createdAt: payment.createdAt,
      consumer: {
        name: payment.consumerId?.name || "Unknown",
        phone: payment.consumerId?.phone || "N/A"
      },
      consumerName: payment.consumerId?.name || "Unknown" // backward compatibility
    }));
    
    res.json(data);
  } catch (error) {
    console.error("Consumer payments GET error:", error.message);
    res.json([]); // never crash
  }
});

// Get payments for a specific consumer
router.get("/consumer/:consumerId", async (req, res) => {
  try {
    let payments = await ConsumerPayment.find({ consumerId: req.params.consumerId })
      .populate('consumerId', 'name phone')
      .sort({ createdAt: -1 });
    
    // Remove broken references
    payments = payments.filter(payment => payment.consumerId !== null);
    
    // Safe response format
    const data = payments.map(payment => ({
      id: payment._id,
      _id: payment._id,
      amount: payment.amount,
      date: payment.date,
      payment_method: payment.payment_method,
      notes: payment.notes,
      createdAt: payment.createdAt,
      consumer: {
        name: payment.consumerId?.name || "Unknown",
        phone: payment.consumerId?.phone || "N/A"
      },
      consumerName: payment.consumerId?.name || "Unknown" // backward compatibility
    }));
    
    res.json(data);
  } catch (error) {
    console.error("Consumer payments GET/consumer error:", error.message);
    res.json([]); // never crash
  }
});

// Create new consumer payment
router.post("/", async (req, res) => {
  try {
    // Support both field names for backwards compatibility
    const { consumer_id, consumerId, amount, payment_date, date, payment_method, notes } = req.body;
    const finalConsumerId = consumer_id || consumerId;
    const finalDate = payment_date || date;

    if (!finalConsumerId || !amount || !finalDate) {
      return res.status(400).json({ error: "consumerId, amount, and date are required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    // Validate that consumer exists before saving
    const Consumer = require("../models/Consumer");
    const consumer = await Consumer.findById(finalConsumerId);
    if (!consumer) {
      console.error(`Invalid consumer_id: ${finalConsumerId}`);
      return res.status(400).json({ error: "Invalid consumer - consumer does not exist" });
    }

    const payment = new ConsumerPayment({
      consumerId: finalConsumerId,
      amount,
      date: new Date(finalDate),
      payment_method: payment_method || 'cash',
      notes: notes || ""
    });

    await payment.save();
    await payment.populate('consumerId', 'name phone');

    res.status(201).json({
      id: payment._id,
      _id: payment._id,
      amount: payment.amount,
      date: payment.date,
      payment_method: payment.payment_method,
      notes: payment.notes,
      createdAt: payment.createdAt,
      consumer: {
        name: payment.consumerId?.name || "Unknown",
        phone: payment.consumerId?.phone || "N/A"
      },
      consumerName: payment.consumerId?.name || "Unknown"
    });
  } catch (error) {
    console.error("Consumer payment POST error:", error.message);
    res.status(500).json({ error: "Failed to create consumer payment", details: error.message });
  }
});

// Get payment summary for a consumer
router.get("/summary/:consumerId", async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const summary = await ConsumerPayment.aggregate([
      { $match: { consumerId: new mongoose.Types.ObjectId(req.params.consumerId) } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalPaid: { $sum: "$amount" },
          lastPaymentDate: { $max: "$date" }
        }
      }
    ]);

    const result = summary[0] || {
      totalPayments: 0,
      totalPaid: 0,
      lastPaymentDate: null
    };

    res.json(result);
  } catch (error) {
    console.error("Consumer payment summary error:", error.message);
    res.json({
      totalPayments: 0,
      totalPaid: 0,
      lastPaymentDate: null,
      error: error.message
    });
  }
});

module.exports = router;