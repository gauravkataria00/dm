const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const MilkEntry = require("../models/MilkEntry");
const ConsumerSale = require("../models/ConsumerSale");
const mongoose = require("mongoose");

// Get all inventory records
router.get("/", async (req, res) => {
  try {
    const { tenantId } = req.user;
    const inventory = await Inventory.find({ tenantId }).sort({ date: -1, createdAt: -1 });
    res.json(inventory.map(item => ({
      id: item._id,
      type: item.type,
      opening_stock: item.opening_stock,
      received: item.received,
      sold: item.sold,
      closing_stock: item.closing_stock,
      date: item.date,
      createdAt: item.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory for a specific date
router.get("/date/:date", async (req, res) => {
  try {
    const { tenantId } = req.user;
    const inventory = await Inventory.find({ tenantId, date: req.params.date }).sort({ createdAt: -1 });
    res.json(inventory.map(item => ({
      id: item._id,
      type: item.type,
      opening_stock: item.opening_stock,
      received: item.received,
      sold: item.sold,
      closing_stock: item.closing_stock,
      date: item.date,
      createdAt: item.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get today's inventory
router.get("/today", async (req, res) => {
  try {
    const { tenantId } = req.user;
    const today = new Date().toISOString().split('T')[0];
    const inventory = await Inventory.find({ tenantId, date: today }).sort({ createdAt: -1 });
    res.json(inventory.map(item => ({
      id: item._id,
      type: item.type,
      opening_stock: item.opening_stock,
      received: item.received,
      sold: item.sold,
      closing_stock: item.closing_stock,
      date: item.date,
      createdAt: item.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new inventory record
router.post("/", async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { type, opening_stock, received, sold, closing_stock, date } = req.body;

    if (!type || !date) {
      return res.status(400).json({ error: "type and date are required" });
    }

    const inventory = new Inventory({
      tenantId,
      type,
      opening_stock: opening_stock || 0,
      received: received || 0,
      sold: sold || 0,
      closing_stock: closing_stock || 0,
      date
    });

    await inventory.save();

    res.json({
      id: inventory._id,
      type: inventory.type,
      opening_stock: inventory.opening_stock,
      received: inventory.received,
      sold: inventory.sold,
      closing_stock: inventory.closing_stock,
      date: inventory.date,
      createdAt: inventory.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update inventory record
router.put("/:id", async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { type, opening_stock, received, sold, closing_stock, date } = req.body;

    const inventory = await Inventory.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      {
        type,
        opening_stock,
        received,
        sold,
        closing_stock,
        date,
      },
      { new: true }
    );

    if (!inventory) {
      return res.status(404).json({ error: "Inventory record not found" });
    }

    res.json({
      id: inventory._id,
      type: inventory.type,
      opening_stock: inventory.opening_stock,
      received: inventory.received,
      sold: inventory.sold,
      closing_stock: inventory.closing_stock,
      date: inventory.date,
      createdAt: inventory.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-calculate inventory for today based on milk entries and sales
router.post("/calculate/today", async (req, res) => {
  try {
    const { tenantId } = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get milk received today (from suppliers)
    const receivedData = await MilkEntry.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(tenantId),
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: "$type",
          totalReceived: { $sum: "$litres" }
        }
      }
    ]);

    // Get milk sold today (to consumers) - assuming consumer sales don't specify type, or handle accordingly
    const soldData = await ConsumerSale.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(tenantId),
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: "$type", // This might be 'milk', need to adjust
          totalSold: { $sum: "$litres" }
        }
      }
    ]);

    // Get yesterday's closing stock
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdayRecords = await Inventory.find({ tenantId, date: yesterdayStr });

    const inventoryRecords = [];

    // Process Cow milk
    const cowReceived = receivedData.find(r => r._id === 'Cow')?.totalReceived || 0;
    const cowSold = soldData.find(s => s._id === 'Cow' || s._id === 'milk')?.totalSold || 0; // Adjust for consumer sales
    const cowYesterday = yesterdayRecords.find(y => y.type === 'Cow')?.closing_stock || 0;

    if (cowReceived > 0 || cowSold > 0 || cowYesterday > 0) {
      inventoryRecords.push({
        type: 'Cow',
        opening_stock: cowYesterday,
        received: cowReceived,
        sold: cowSold,
        closing_stock: cowYesterday + cowReceived - cowSold,
        date: today.toISOString().split('T')[0]
      });
    }

    // Process Buffalo milk
    const buffaloReceived = receivedData.find(r => r._id === 'Buffalo')?.totalReceived || 0;
    const buffaloSold = soldData.find(s => s._id === 'Buffalo' || s._id === 'milk')?.totalSold || 0; // Adjust
    const buffaloYesterday = yesterdayRecords.find(y => y.type === 'Buffalo')?.closing_stock || 0;

    if (buffaloReceived > 0 || buffaloSold > 0 || buffaloYesterday > 0) {
      inventoryRecords.push({
        type: 'Buffalo',
        opening_stock: buffaloYesterday,
        received: buffaloReceived,
        sold: buffaloSold,
        closing_stock: buffaloYesterday + buffaloReceived - buffaloSold,
        date: today.toISOString().split('T')[0]
      });
    }

    // Insert or update inventory records
    for (const record of inventoryRecords) {
      await Inventory.findOneAndUpdate(
        { tenantId, type: record.type, date: record.date },
        { ...record, tenantId },
        { upsert: true, new: true }
      );
    }

    res.json({
      message: "Inventory calculated and updated successfully",
      records: inventoryRecords
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;