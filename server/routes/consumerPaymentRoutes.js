const express = require("express");
const router = express.Router();
const ConsumerPayment = require("../models/ConsumerPayment");

// Get all consumer payments
router.get("/", async (req, res) => {
  try {
    const payments = await ConsumerPayment.find().populate('consumerId', 'name').sort({ createdAt: -1 });
    res.json(payments.map(payment => ({
      id: payment._id,
      consumerId: payment.consumerId._id,
      consumerName: payment.consumerId.name,
      amount: payment.amount,
      date: payment.date,
      payment_method: payment.payment_method,
      notes: payment.notes,
      createdAt: payment.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payments for a specific consumer
router.get("/consumer/:consumerId", async (req, res) => {
  try {
    const payments = await ConsumerPayment.find({ consumerId: req.params.consumerId }).populate('consumerId', 'name').sort({ createdAt: -1 });
    res.json(payments.map(payment => ({
      id: payment._id,
      consumerId: payment.consumerId._id,
      consumerName: payment.consumerId.name,
      amount: payment.amount,
      date: payment.date,
      payment_method: payment.payment_method,
      notes: payment.notes,
      createdAt: payment.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new consumer payment
router.post("/", async (req, res) => {
  try {
    const { consumer_id, amount, payment_date, payment_method, notes } = req.body;

    if (!consumer_id || !amount || !payment_date) {
      return res.status(400).json({ error: "consumer_id, amount, and payment_date are required" });
    }

    const payment = new ConsumerPayment({
      consumerId: consumer_id,
      amount,
      date: payment_date,
      payment_method: payment_method || 'cash',
      notes
    });

    await payment.save();
    await payment.populate('consumerId', 'name');

    res.json({
      id: payment._id,
      consumerId: payment.consumerId._id,
      consumerName: payment.consumerId.name,
      amount: payment.amount,
      date: payment.date,
      payment_method: payment.payment_method,
      notes: payment.notes,
      createdAt: payment.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment summary for a consumer
router.get("/summary/:consumerId", async (req, res) => {
  try {
    const summary = await ConsumerPayment.aggregate([
      { $match: { consumerId: require('mongoose').Types.ObjectId(req.params.consumerId) } },
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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;