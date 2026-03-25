const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const MilkEntry = require("../models/MilkEntry");
const Client = require("../models/Client");

// Get all milk entries with proper error handling
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const clientId = req.query.clientId;
    const skip = (page - 1) * limit;

    let query = {};
    if (clientId) {
      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        return res.status(400).json({ error: "Invalid clientId" });
      }
      query.clientId = new mongoose.Types.ObjectId(clientId);
    }

    const [result] = await MilkEntry.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: "clients",
                localField: "clientId",
                foreignField: "_id",
                as: "client"
              }
            },
            {
              $unwind: {
                path: "$client",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $project: {
                _id: 1,
                clientId: "$client._id",
                litres: 1,
                fat: 1,
                snf: 1,
                rate: 1,
                total: 1,
                type: 1,
                shift: 1,
                createdAt: 1,
                clientName: { $ifNull: ["$client.name", "Unknown"] },
                clientPhone: { $ifNull: ["$client.phone", "N/A"] }
              }
            }
          ],
          total: [{ $count: "count" }]
        }
      }
    ]);

    const milkEntries = result?.data || [];
    const total = result?.total?.[0]?.count || 0;

    const data = milkEntries.map(entry => ({
      id: entry._id,
      _id: entry._id,
      clientId: entry.clientId,
      litres: entry.litres,
      fat: entry.fat,
      snf: entry.snf,
      rate: entry.rate,
      total: entry.total,
      type: entry.type,
      shift: entry.shift,
      createdAt: entry.createdAt,
      client: {
        name: entry.clientName || "Unknown",
        phone: entry.clientPhone || "N/A"
      },
      clientName: entry.clientName || "Unknown"
    }));

    res.json({
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Milk GET error:", error.message);
    res.status(500).json({ error: "Failed to fetch milk entries", details: error.message });
  }
});

// Create new milk entry
router.post("/", async (req, res) => {
  try {
    const { clientId, type, litres, fat, snf, rate, total, shift } = req.body;

    // Validation
    if (!clientId) return res.status(400).json({ error: "clientId is required" });
    if (!litres || litres <= 0) return res.status(400).json({ error: "Litres must be greater than 0" });
    if (fat === undefined || fat < 0 || fat > 8) return res.status(400).json({ error: "Fat must be between 0 and 8" });
    if (snf === undefined || snf < 0 || snf > 10) return res.status(400).json({ error: "SNF must be between 0 and 10" });
    if (!rate || rate < 0) return res.status(400).json({ error: "Rate must be provided and positive" });

    // Validate client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(400).json({ error: "Invalid client - client does not exist" });
    }

    // Calculate total if not provided
    const calculatedTotal = litres * rate;

    const milkEntry = new MilkEntry({
      clientId,
      type: type || "Standard",
      litres,
      fat,
      snf,
      rate,
      total: total || calculatedTotal,
      shift: shift || "morning"
    });

    await milkEntry.save();
    await milkEntry.populate('clientId', 'name phone');

    res.status(201).json({
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
      clientName: milkEntry.clientId?.name || "Unknown"
    });
  } catch (error) {
    console.error("Milk POST error:", error.message);
    res.status(500).json({ error: "Failed to create milk entry", details: error.message });
  }
});

// Delete milk entry
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid milk entry ID" });
    }

    const deletedEntry = await MilkEntry.findByIdAndDelete(id);

    if (!deletedEntry) {
      return res.status(404).json({ error: "Milk entry not found" });
    }

    res.status(200).json({ success: true, message: "Entry deleted successfully" });
  } catch (error) {
    console.error("Milk DELETE error:", error.message);
    res.status(500).json({ error: "Failed to delete milk entry", details: error.message });
  }
});

module.exports = router;
