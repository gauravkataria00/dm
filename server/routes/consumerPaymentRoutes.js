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
    const { consumer_id, amount, payment_date, payment_method, notes } = req.body;

    if (!consumer_id || !amount || !payment_date) {
      return res.status(400).json({ error: "consumer_id, amount, and payment_date are required" });
    }

    // Validate that consumer exists before saving
    const Consumer = require("../models/Consumer");
    const consumer = await Consumer.findById(consumer_id);
    if (!consumer) {
      console.error(`Invalid consumer_id: ${consumer_id}`);
      return res.status(400).json({ error: "Invalid consumer" });
    }

    const payment = new ConsumerPayment({
      consumerId: consumer_id,
      amount,
      date: payment_date,
      payment_method: payment_method || 'cash',
      notes
    });

    await payment.save();
    await payment.populate('consumerId', 'name phone');

    res.json({
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
    });
  } catch (error) {
    console.error("Consumer payment POST error:", error.message);
    res.status(500).json({ error: error.message });
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