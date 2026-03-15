const express = require("express");
const router = express.Router();
const Settlement = require("../models/Settlement");
const MilkEntry = require("../models/MilkEntry");

// Get all settlements with client names
router.get("/", async (req, res) => {
  try {
    const settlements = await Settlement.find().populate('clientId', 'name').sort({ createdAt: -1 });
    res.json(settlements.map(settlement => ({
      id: settlement._id,
      clientId: settlement.clientId._id,
      clientName: settlement.clientId.name,
      startDate: settlement.startDate,
      endDate: settlement.endDate,
      totalLitres: settlement.totalLitres,
      totalAmount: settlement.totalAmount,
      status: settlement.status,
      createdAt: settlement.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get settlements for a specific client
router.get("/client/:clientId", async (req, res) => {
  try {
    const settlements = await Settlement.find({ clientId: req.params.clientId }).populate('clientId', 'name').sort({ createdAt: -1 });
    res.json(settlements.map(settlement => ({
      id: settlement._id,
      clientId: settlement.clientId._id,
      clientName: settlement.clientId.name,
      startDate: settlement.startDate,
      endDate: settlement.endDate,
      totalLitres: settlement.totalLitres,
      totalAmount: settlement.totalAmount,
      status: settlement.status,
      createdAt: settlement.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new settlement for a client (calculate for a period)
router.post("/", async (req, res) => {
  try {
    const { clientId, startDate, endDate } = req.body;

    if (!clientId || !startDate || !endDate) {
      return res.status(400).json({ error: "clientId, startDate, and endDate are required" });
    }

    // Calculate total milk and amount for the period
    const milkData = await MilkEntry.aggregate([
      {
        $match: {
          clientId: require('mongoose').Types.ObjectId(clientId),
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: null,
          totalLitres: { $sum: "$litres" },
          totalAmount: { $sum: "$total" }
        }
      }
    ]);

    const totalLitres = milkData[0]?.totalLitres || 0;
    const totalAmount = milkData[0]?.totalAmount || 0;

    const settlement = new Settlement({
      clientId,
      startDate,
      endDate,
      totalLitres,
      totalAmount,
      status: 'pending'
    });

    await settlement.save();
    await settlement.populate('clientId', 'name');

    res.json({
      id: settlement._id,
      clientId: settlement.clientId._id,
      clientName: settlement.clientId.name,
      startDate: settlement.startDate,
      endDate: settlement.endDate,
      totalLitres: settlement.totalLitres,
      totalAmount: settlement.totalAmount,
      status: settlement.status,
      createdAt: settlement.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settlement status
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const settlement = await Settlement.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!settlement) {
      return res.status(404).json({ error: "Settlement not found" });
    }

    res.json({ message: "Settlement updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;