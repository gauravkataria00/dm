const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Settlement = require("../models/Settlement");
const MilkEntry = require("../models/MilkEntry");

// Get all settlements with client names
router.get("/", async (req, res) => {
  try {
    let settlements = await Settlement.find({ userId: req.user.id })
      .populate('clientId', 'name phone')
      .sort({ createdAt: -1 });
    
    // Remove broken references
    settlements = settlements.filter(settlement => settlement.clientId !== null);
    
    // Safe response format
    const data = settlements.map(settlement => ({
      id: settlement._id,
      _id: settlement._id,
      startDate: settlement.startDate,
      endDate: settlement.endDate,
      totalLitres: settlement.totalLitres,
      totalAmount: settlement.totalAmount,
      status: settlement.status,
      createdAt: settlement.createdAt,
      client: {
        name: settlement.clientId?.name || "Unknown",
        phone: settlement.clientId?.phone || "N/A"
      },
      clientName: settlement.clientId?.name || "Unknown" // backward compatibility
    }));
    
    res.json(data);
  } catch (error) {
    console.error("Settlements GET error:", error.message);
    res.json([]); // never crash
  }
});

// Get settlements for a specific client
router.get("/client/:clientId", async (req, res) => {
  try {
    let settlements = await Settlement.find({ userId: req.user.id, clientId: req.params.clientId })
      .populate('clientId', 'name phone')
      .sort({ createdAt: -1 });
    
    // Remove broken references
    settlements = settlements.filter(settlement => settlement.clientId !== null);
    
    // Safe response format
    const data = settlements.map(settlement => ({
      id: settlement._id,
      _id: settlement._id,
      startDate: settlement.startDate,
      endDate: settlement.endDate,
      totalLitres: settlement.totalLitres,
      totalAmount: settlement.totalAmount,
      status: settlement.status,
      createdAt: settlement.createdAt,
      client: {
        name: settlement.clientId?.name || "Unknown",
        phone: settlement.clientId?.phone || "N/A"
      },
      clientName: settlement.clientId?.name || "Unknown" // backward compatibility
    }));
    
    res.json(data);
  } catch (error) {
    console.error("Settlements GET/client error:", error.message);
    res.json([]); // never crash
  }
});

// Create a new settlement for a client (calculate for a period)
router.post("/", async (req, res) => {
  try {
    const { clientId, startDate, endDate } = req.body;

    if (!clientId || !startDate || !endDate) {
      return res.status(400).json({ error: "clientId, startDate, and endDate are required" });
    }

    // Validate that client exists before saving
    const Client = require("../models/Client");
    const client = await Client.findOne({ _id: clientId, userId: req.user.id });
    if (!client) {
      console.error(`Invalid clientId: ${clientId}`);
      return res.status(400).json({ error: "Invalid client" });
    }

    // Calculate total milk and amount for the period
    const clientObjectId = new mongoose.Types.ObjectId(clientId);
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const milkData = await MilkEntry.aggregate([
      {
        $match: {
          userId: userObjectId,
          clientId: clientObjectId,
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
      userId: req.user.id,
      clientId,
      startDate,
      endDate,
      totalLitres,
      totalAmount,
      status: 'pending'
    });

    await settlement.save();
    await settlement.populate('clientId', 'name phone');

    res.json({
      id: settlement._id,
      _id: settlement._id,
      startDate: settlement.startDate,
      endDate: settlement.endDate,
      totalLitres: settlement.totalLitres,
      totalAmount: settlement.totalAmount,
      status: settlement.status,
      createdAt: settlement.createdAt,
      client: {
        name: settlement.clientId?.name || "Unknown",
        phone: settlement.clientId?.phone || "N/A"
      },
      clientName: settlement.clientId?.name || "Unknown" // backward compatibility
    });
  } catch (error) {
    console.error("Settlement POST error:", error.message);
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

    const settlement = await Settlement.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { status }, { new: true });
    if (!settlement) {
      return res.status(404).json({ error: "Settlement not found" });
    }

    console.log(`Settlement ${req.params.id} updated to status: ${status}`);
    res.json({ message: "Settlement updated successfully" });
  } catch (error) {
    console.error("Settlement PUT error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;