const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const MilkEntry = require("../models/MilkEntry");
const Advance = require("../models/Advance");
const Settlement = require("../models/Settlement");

// Get all payments with client and settlement info
router.get("/", async (req, res) => {
  try {
    let payments = await Payment.find({ userId: req.user.id })
      .populate('clientId', 'name phone')
      .populate('settlementId', 'startDate endDate')
      .sort({ createdAt: -1 });
    
    // Remove broken references
    payments = payments.filter(payment => payment.clientId !== null);
    
    // Safe response format
    const data = payments.map(payment => ({
      id: payment._id,
      _id: payment._id,
      settlementId: payment.settlementId?._id,
      startDate: payment.settlementId?.startDate,
      endDate: payment.settlementId?.endDate,
      amount: payment.amount,
      type: payment.type,
      date: payment.date,
      notes: payment.notes,
      createdAt: payment.createdAt,
      client: {
        name: payment.clientId?.name || "Unknown",
        phone: payment.clientId?.phone || "N/A"
      },
      clientName: payment.clientId?.name || "Unknown" // backward compatibility
    }));
    
    res.json(data);
  } catch (error) {
    console.error("Payments GET error:", error.message);
    res.json([]); // never crash
  }
});

// Get payments for a specific client
router.get("/client/:clientId", async (req, res) => {
  try {
    let payments = await Payment.find({ userId: req.user.id, clientId: req.params.clientId })
      .populate('clientId', 'name phone')
      .populate('settlementId', 'startDate endDate')
      .sort({ createdAt: -1 });
    
    // Remove broken references
    payments = payments.filter(payment => payment.clientId !== null);
    
    // Safe response format
    const data = payments.map(payment => ({
      id: payment._id,
      _id: payment._id,
      settlementId: payment.settlementId?._id,
      startDate: payment.settlementId?.startDate,
      endDate: payment.settlementId?.endDate,
      amount: payment.amount,
      type: payment.type,
      date: payment.date,
      notes: payment.notes,
      createdAt: payment.createdAt,
      client: {
        name: payment.clientId?.name || "Unknown",
        phone: payment.clientId?.phone || "N/A"
      },
      clientName: payment.clientId?.name || "Unknown" // backward compatibility
    }));
    
    res.json(data);
  } catch (error) {
    console.error("Payments GET/client error:", error.message);
    res.json([]); // never crash
  }
});

// Add a new payment
router.post("/", async (req, res) => {
  try {
    const { clientId, settlementId, amount, type, date, notes } = req.body;

    if (!clientId || !amount || !type || !date) {
      return res.status(400).json({ error: "clientId, amount, type, and date are required" });
    }

    // Validate that client exists before saving
    const Client = require("../models/Client");
    const client = await Client.findOne({ _id: clientId, userId: req.user.id });
    if (!client) {
      console.error(`Invalid clientId: ${clientId}`);
      return res.status(400).json({ error: "Invalid client" });
    }

    const payment = new Payment({ userId: req.user.id, clientId, settlementId, amount, type, date, notes });
    await payment.save();

    await payment.populate('clientId', 'name phone');
    await payment.populate('settlementId', 'startDate endDate');

    res.json({
      id: payment._id,
      _id: payment._id,
      settlementId: payment.settlementId?._id,
      startDate: payment.settlementId?.startDate,
      endDate: payment.settlementId?.endDate,
      amount: payment.amount,
      type: payment.type,
      date: payment.date,
      notes: payment.notes,
      createdAt: payment.createdAt,
      client: {
        name: payment.clientId?.name || "Unknown",
        phone: payment.clientId?.phone || "N/A"
      },
      clientName: payment.clientId?.name || "Unknown" // backward compatibility
    });
  } catch (error) {
    console.error("Payment POST error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get client payment summary (total owed, paid, advances, etc.)
router.get("/summary/:clientId", async (req, res) => {
  try {
    const clientId = req.params.clientId;
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const clientObjectId = new mongoose.Types.ObjectId(clientId);

    const [totalEarned, totalPaid, advancesGiven, advancesRepaid, pendingSettlements] = await Promise.all([
      MilkEntry.aggregate([
        { $match: { userId: userObjectId, clientId: clientObjectId } },
        { $group: { _id: null, amount: { $sum: "$total" } } }
      ]),
      Payment.aggregate([
        { $match: { userId: userObjectId, clientId: clientObjectId, type: { $in: ['settlement_payment', 'advance_repaid'] } } },
        { $group: { _id: null, amount: { $sum: "$amount" } } }
      ]),
      Advance.aggregate([
        { $match: { userId: userObjectId, clientId: clientObjectId, status: 'active' } },
        { $group: { _id: null, amount: { $sum: "$amount" } } }
      ]),
      Payment.aggregate([
        { $match: { userId: userObjectId, clientId: clientObjectId, type: 'advance_repaid' } },
        { $group: { _id: null, amount: { $sum: "$amount" } } }
      ]),
      Settlement.aggregate([
        { $match: { userId: userObjectId, clientId: clientObjectId, status: 'pending' } },
        { $group: { _id: null, amount: { $sum: "$totalAmount" } } }
      ])
    ]);

    const totalEarnedAmount = totalEarned[0]?.amount || 0;
    const totalPaidAmount = totalPaid[0]?.amount || 0;
    const advancesGivenAmount = advancesGiven[0]?.amount || 0;
    const advancesRepaidAmount = advancesRepaid[0]?.amount || 0;
    const pendingSettlementsAmount = pendingSettlements[0]?.amount || 0;

    const netOutstanding = totalEarnedAmount - totalPaidAmount - advancesRepaidAmount + advancesGivenAmount;

    res.json({
      clientId,
      totalEarned: totalEarnedAmount,
      totalPaid: totalPaidAmount,
      advancesGiven: advancesGivenAmount,
      advancesRepaid: advancesRepaidAmount,
      pendingSettlements: pendingSettlementsAmount,
      netOutstanding,
      status: netOutstanding > 0 ? 'owed_to_client' : netOutstanding < 0 ? 'client_owes' : 'settled'
    });
  } catch (error) {
    console.error("Payment summary error:", error.message);
    res.json({
      clientId: req.params.clientId,
      totalEarned: 0,
      totalPaid: 0,
      advancesGiven: 0,
      advancesRepaid: 0,
      pendingSettlements: 0,
      netOutstanding: 0,
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;