const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const ConsumerSale = require("../models/ConsumerSale");

// Get all consumer sales
router.get("/", async (req, res) => {
  try {
    let sales = await ConsumerSale.find({ userId: req.user.id })
      .populate('consumerId', 'name phone')
      .sort({ createdAt: -1 });
    
    // Remove broken references
    sales = sales.filter(sale => sale.consumerId !== null);
    
    // Safe response format
    const data = sales.map(sale => ({
      id: sale._id,
      _id: sale._id,
      type: sale.type,
      litres: sale.litres,
      rate: sale.rate,
      total: sale.total,
      payment_status: sale.payment_status,
      sale_date: sale.sale_date,
      createdAt: sale.createdAt,
      consumer: {
        name: sale.consumerId?.name || "Unknown",
        phone: sale.consumerId?.phone || "N/A"
      },
      consumerName: sale.consumerId?.name || "Unknown" // backward compatibility
    }));
    
    res.json(data);
  } catch (error) {
    console.error("Consumer sales GET error:", error.message);
    res.json([]); // never crash
  }
});

// Get sales for a specific consumer
router.get("/consumer/:consumerId", async (req, res) => {
  try {
    let sales = await ConsumerSale.find({ userId: req.user.id, consumerId: req.params.consumerId })
      .populate('consumerId', 'name phone')
      .sort({ createdAt: -1 });
    
    // Remove broken references
    sales = sales.filter(sale => sale.consumerId !== null);
    
    // Safe response format
    const data = sales.map(sale => ({
      id: sale._id,
      _id: sale._id,
      type: sale.type,
      litres: sale.litres,
      rate: sale.rate,
      total: sale.total,
      payment_status: sale.payment_status,
      sale_date: sale.sale_date,
      createdAt: sale.createdAt,
      consumer: {
        name: sale.consumerId?.name || "Unknown",
        phone: sale.consumerId?.phone || "N/A"
      },
      consumerName: sale.consumerId?.name || "Unknown" // backward compatibility
    }));
    
    res.json(data);
  } catch (error) {
    console.error("Consumer sales GET/consumer error:", error.message);
    res.json([]); // never crash
  }
});

// Get today's sales
router.get("/today", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let sales = await ConsumerSale.find({
      userId: req.user.id,
      createdAt: { $gte: today, $lt: tomorrow }
    })
      .populate('consumerId', 'name phone')
      .sort({ createdAt: -1 });

    // Remove broken references
    sales = sales.filter(sale => sale.consumerId !== null);
    
    // Safe response format
    const data = sales.map(sale => ({
      id: sale._id,
      _id: sale._id,
      type: sale.type,
      litres: sale.litres,
      rate: sale.rate,
      total: sale.total,
      payment_status: sale.payment_status,
      sale_date: sale.sale_date,
      createdAt: sale.createdAt,
      consumer: {
        name: sale.consumerId?.name || "Unknown",
        phone: sale.consumerId?.phone || "N/A"
      },
      consumerName: sale.consumerId?.name || "Unknown" // backward compatibility
    }));

    res.json(data);
  } catch (error) {
    console.error("Consumer sales GET/today error:", error.message);
    res.json([]); // never crash
  }
});

// Create new consumer sale
router.post("/", async (req, res) => {
  try {
    const { consumer_id, quantity, price_per_liter, total_amount, payment_status, sale_date } = req.body;

    if (!consumer_id || !quantity || !price_per_liter || !total_amount) {
      return res.status(400).json({ error: "consumer_id, quantity, price_per_liter, and total_amount are required" });
    }

    // Validate that consumer exists before saving
    const Consumer = require("../models/Consumer");
    const consumer = await Consumer.findOne({ _id: consumer_id, userId: req.user.id });
    if (!consumer) {
      console.error(`Invalid consumer_id: ${consumer_id}`);
      return res.status(400).json({ error: "Invalid consumer" });
    }

    const sale = new ConsumerSale({
      userId: req.user.id,
      consumerId: consumer_id,
      type: 'milk',
      litres: quantity,
      rate: price_per_liter,
      total: total_amount,
      payment_status: payment_status || 'pending',
      sale_date: sale_date || new Date()
    });

    await sale.save();
    await sale.populate('consumerId', 'name phone');

    res.json({
      id: sale._id,
      _id: sale._id,
      type: sale.type,
      litres: sale.litres,
      rate: sale.rate,
      total: sale.total,
      payment_status: sale.payment_status,
      sale_date: sale.sale_date,
      createdAt: sale.createdAt,
      consumer: {
        name: sale.consumerId?.name || "Unknown",
        phone: sale.consumerId?.phone || "N/A"
      },
      consumerName: sale.consumerId?.name || "Unknown" // backward compatibility
    });
  } catch (error) {
    console.error("Consumer sale POST error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update sale payment status
router.put("/:id/status", async (req, res) => {
  try {
    const { payment_status } = req.body;

    if (!payment_status) {
      return res.status(400).json({ error: "payment_status is required" });
    }

    const sale = await ConsumerSale.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { payment_status }, { new: true });
    if (!sale) {
      return res.status(404).json({ error: "Sale not found" });
    }

    console.log(`Sale ${req.params.id} payment status updated to: ${payment_status}`);
    res.json({ message: "Sale status updated successfully" });
  } catch (error) {
    console.error("Consumer sale PUT error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get sales summary for a date range
router.get("/summary/range", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const summary = await ConsumerSale.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalLitres: { $sum: "$litres" },
          totalRevenue: { $sum: "$total" },
          pendingAmount: {
            $sum: {
              $cond: [{ $eq: ["$payment_status", "pending"] }, "$total", 0]
            }
          },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ["$payment_status", "paid"] }, "$total", 0]
            }
          }
        }
      }
    ]);

    const result = summary[0] || {
      totalSales: 0,
      totalLitres: 0,
      totalRevenue: 0,
      pendingAmount: 0,
      paidAmount: 0
    };

    res.json(result);
  } catch (error) {
    console.error("Consumer sales summary error:", error.message);
    res.json({
      totalSales: 0,
      totalLitres: 0,
      totalRevenue: 0,
      pendingAmount: 0,
      paidAmount: 0,
      error: error.message
    });
  }
});

module.exports = router;