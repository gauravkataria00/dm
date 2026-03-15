const express = require("express");
const router = express.Router();
const ConsumerSale = require("../models/ConsumerSale");

// Get all consumer sales
router.get("/", async (req, res) => {
  try {
    const sales = await ConsumerSale.find().populate('consumerId', 'name').sort({ createdAt: -1 });
    res.json(sales.map(sale => ({
      id: sale._id,
      consumerId: sale.consumerId._id,
      consumerName: sale.consumerId.name,
      type: sale.type,
      litres: sale.litres,
      rate: sale.rate,
      total: sale.total,
      payment_status: sale.payment_status,
      sale_date: sale.sale_date,
      createdAt: sale.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sales for a specific consumer
router.get("/consumer/:consumerId", async (req, res) => {
  try {
    const sales = await ConsumerSale.find({ consumerId: req.params.consumerId }).populate('consumerId', 'name').sort({ createdAt: -1 });
    res.json(sales.map(sale => ({
      id: sale._id,
      consumerId: sale.consumerId._id,
      consumerName: sale.consumerId.name,
      type: sale.type,
      litres: sale.litres,
      rate: sale.rate,
      total: sale.total,
      payment_status: sale.payment_status,
      sale_date: sale.sale_date,
      createdAt: sale.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get today's sales
router.get("/today", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sales = await ConsumerSale.find({
      createdAt: { $gte: today, $lt: tomorrow }
    }).populate('consumerId', 'name').sort({ createdAt: -1 });

    res.json(sales.map(sale => ({
      id: sale._id,
      consumerId: sale.consumerId._id,
      consumerName: sale.consumerId.name,
      type: sale.type,
      litres: sale.litres,
      rate: sale.rate,
      total: sale.total,
      payment_status: sale.payment_status,
      sale_date: sale.sale_date,
      createdAt: sale.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new consumer sale
router.post("/", async (req, res) => {
  try {
    const { consumer_id, quantity, price_per_liter, total_amount, payment_status, sale_date } = req.body;

    if (!consumer_id || !quantity || !price_per_liter || !total_amount) {
      return res.status(400).json({ error: "consumer_id, quantity, price_per_liter, and total_amount are required" });
    }

    const sale = new ConsumerSale({
      consumerId: consumer_id,
      type: 'milk',
      litres: quantity,
      rate: price_per_liter,
      total: total_amount,
      payment_status: payment_status || 'pending',
      sale_date: sale_date || new Date()
    });

    await sale.save();
    await sale.populate('consumerId', 'name');

    res.json({
      id: sale._id,
      consumerId: sale.consumerId._id,
      consumerName: sale.consumerId.name,
      type: sale.type,
      litres: sale.litres,
      rate: sale.rate,
      total: sale.total,
      payment_status: sale.payment_status,
      sale_date: sale.sale_date,
      createdAt: sale.createdAt
    });
  } catch (error) {
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

    const sale = await ConsumerSale.findByIdAndUpdate(req.params.id, { payment_status }, { new: true });
    if (!sale) {
      return res.status(404).json({ error: "Sale not found" });
    }

    res.json({ message: "Sale status updated successfully" });
  } catch (error) {
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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;