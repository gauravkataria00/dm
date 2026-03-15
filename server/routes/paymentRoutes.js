const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const MilkEntry = require("../models/MilkEntry");
const Advance = require("../models/Advance");
const Settlement = require("../models/Settlement");

// Get all payments with client and settlement info
router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('clientId', 'name')
      .populate('settlementId', 'startDate endDate')
      .sort({ createdAt: -1 });
    res.json(payments.map(payment => ({
      id: payment._id,
      clientId: payment.clientId._id,
      clientName: payment.clientId.name,
      settlementId: payment.settlementId?._id,
      startDate: payment.settlementId?.startDate,
      endDate: payment.settlementId?.endDate,
      amount: payment.amount,
      type: payment.type,
      date: payment.date,
      notes: payment.notes,
      createdAt: payment.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payments for a specific client
router.get("/client/:clientId", async (req, res) => {
  try {
    const payments = await Payment.find({ clientId: req.params.clientId })
      .populate('clientId', 'name')
      .populate('settlementId', 'startDate endDate')
      .sort({ createdAt: -1 });
    res.json(payments.map(payment => ({
      id: payment._id,
      clientId: payment.clientId._id,
      clientName: payment.clientId.name,
      settlementId: payment.settlementId?._id,
      startDate: payment.settlementId?.startDate,
      endDate: payment.settlementId?.endDate,
      amount: payment.amount,
      type: payment.type,
      date: payment.date,
      notes: payment.notes,
      createdAt: payment.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new payment
router.post("/", async (req, res) => {
  try {
    const { clientId, settlementId, amount, type, date, notes } = req.body;

    if (!clientId || !amount || !type || !date) {
      return res.status(400).json({ error: "clientId, amount, type, and date are required" });
    }

    const payment = new Payment({ clientId, settlementId, amount, type, date, notes });
    await payment.save();

    await payment.populate('clientId', 'name');
    await payment.populate('settlementId', 'startDate endDate');

    res.json({
      id: payment._id,
      clientId: payment.clientId._id,
      clientName: payment.clientId.name,
      settlementId: payment.settlementId?._id,
      startDate: payment.settlementId?.startDate,
      endDate: payment.settlementId?.endDate,
      amount: payment.amount,
      type: payment.type,
      date: payment.date,
      notes: payment.notes,
      createdAt: payment.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get client payment summary (total owed, paid, advances, etc.)
router.get("/summary/:clientId", async (req, res) => {
  try {
    const clientId = req.params.clientId;

    const [totalEarned, totalPaid, advancesGiven, advancesRepaid, pendingSettlements] = await Promise.all([
      MilkEntry.aggregate([
        { $match: { clientId: require('mongoose').Types.ObjectId(clientId) } },
        { $group: { _id: null, amount: { $sum: "$total" } } }
      ]),
      Payment.aggregate([
        { $match: { clientId: require('mongoose').Types.ObjectId(clientId), type: { $in: ['settlement_payment', 'advance_repaid'] } } },
        { $group: { _id: null, amount: { $sum: "$amount" } } }
      ]),
      Advance.aggregate([
        { $match: { clientId: require('mongoose').Types.ObjectId(clientId), status: 'active' } },
        { $group: { _id: null, amount: { $sum: "$amount" } } }
      ]),
      Payment.aggregate([
        { $match: { clientId: require('mongoose').Types.ObjectId(clientId), type: 'advance_repaid' } },
        { $group: { _id: null, amount: { $sum: "$amount" } } }
      ]),
      Settlement.aggregate([
        { $match: { clientId: require('mongoose').Types.ObjectId(clientId), status: 'pending' } },
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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;