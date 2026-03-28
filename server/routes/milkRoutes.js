const express = require("express");
const router = express.Router();
const MilkEntry = require("../models/MilkEntry");
const Client = require("../models/Client");

router.get("/", async (req, res) => {
  try {
    const milkEntries = await MilkEntry.find().sort({ createdAt: -1 }).lean();

    // Gather client IDs (even if some are invalid/missing)
    const mongoose = require('mongoose');
    const clientIds = [...new Set(milkEntries
      .map(entry => entry.clientId)
      .filter(id => id && mongoose.Types.ObjectId.isValid(id))
      .map(id => id.toString()))];

    const clients = await Client.find({ _id: { $in: clientIds } }).select('name phone').lean();
    const clientMap = clients.reduce((acc, client) => {
      acc[client._id.toString()] = client;
      return acc;
    }, {});

    const data = milkEntries.map(entry => {
      const client = clientMap[entry.clientId?.toString()];
      return {
        id: entry._id,
        _id: entry._id,
        clientId: entry.clientId ? entry.clientId.toString() : null,
        litres: entry.litres,
        fat: entry.fat,
        snf: entry.snf,
        rate: entry.rate,
        total: entry.total,
        type: entry.type,
        createdAt: entry.createdAt,
        client: {
          name: client?.name || "Unknown",
          phone: client?.phone || "N/A"
        },
        clientName: client?.name || "Unknown" // backward compatibility
      };
    });

    res.json(data);
  } catch (error) {
    console.error("Milk GET error:", error);
    // Return empty array even on failure to avoid 500 errors
    res.status(200).json([]);
  }
});

router.post("/", async (req, res) => {
  try {
    const { clientId, type, litres, fat, snf, rate, total, shift } = req.body;
    if (!clientId) return res.status(400).json({ error: "clientId is required" });

    // Validate that client exists before saving
    const client = await Client.findById(clientId);
    if (!client) {
      console.error(`Invalid clientId: ${clientId}`);
      return res.status(400).json({ error: "Invalid client" });
    }

    const milkEntry = new MilkEntry({ clientId, type, litres, fat, snf, rate, total, shift });
    await milkEntry.save();

    await milkEntry.populate('clientId', 'name phone');
    
    res.json({
      id: milkEntry._id,
      _id: milkEntry._id,
      litres: milkEntry.litres,
      fat: milkEntry.fat,
      snf: milkEntry.snf,
      rate: milkEntry.rate,
      total: milkEntry.total,
      type: milkEntry.type,
      shift: milkEntry.shift,
      createdAt: milkEntry.createdAt,
      client: {
        name: milkEntry.clientId?.name || "Unknown",
        phone: milkEntry.clientId?.phone || "N/A"
      },
      clientName: milkEntry.clientId?.name || "Unknown" // backward compatibility
    });
  } catch (error) {
    console.error("Milk POST error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log("DELETE request received for ID:", id);
    
    if (!id) {
      console.warn("No ID provided");
      return res.status(400).json({ error: "ID is required" });
    }

    console.log("Attempting to delete entry with ID:", id);
    
    const deletedEntry = await MilkEntry.findByIdAndDelete(id);
    
    if (!deletedEntry) {
      console.warn("Entry not found for ID:", id);
      return res.status(404).json({ error: "Entry not found" });
    }

    console.log("Entry deleted successfully:", id);
    res.status(200).json({ message: "Entry deleted successfully", deletedEntry });
  } catch (error) {
    console.error("Milk DELETE error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
