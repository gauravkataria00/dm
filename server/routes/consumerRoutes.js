const express = require("express");
const router = express.Router();
const Consumer = require("../models/Consumer");
const ConsumerSale = require("../models/ConsumerSale");
const ConsumerPayment = require("../models/ConsumerPayment");
const mongoose = require("mongoose");

const scopedFilter = (req, extra = {}) => {
  const adminId = req.user.id;
  return {
    adminId,
    ...extra,
  };
};

// Get all consumers
router.get("/", async (req, res) => {
  try {
    const consumers = await Consumer.find(scopedFilter(req)).sort({ createdAt: -1 });
    res.json(consumers.map(consumer => ({
      id: consumer._id,
      name: consumer.name,
      phone: consumer.phone,
      address: consumer.address,
      type: consumer.type,
      credit_limit: consumer.credit_limit,
      createdAt: consumer.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single consumer by ID
router.get("/:id", async (req, res) => {
  try {
    const consumer = await Consumer.findOne(scopedFilter(req, { _id: req.params.id }));
    if (!consumer) return res.status(404).json({ error: "Consumer not found" });
    res.json({
      id: consumer._id,
      name: consumer.name,
      phone: consumer.phone,
      address: consumer.address,
      type: consumer.type,
      credit_limit: consumer.credit_limit,
      createdAt: consumer.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new consumer
router.post("/", async (req, res) => {
  try {
    const { tenantId, id } = req.user;
    const adminId = id;
    const { name, phone, address, type, credit_limit } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Consumer name is required" });
    }

    const consumer = new Consumer({
      tenantId,
      adminId,
      name,
      phone,
      address,
      type: type || 'regular',
      credit_limit: credit_limit || 0
    });
    await consumer.save();

    res.json({
      id: consumer._id,
      name: consumer.name,
      phone: consumer.phone,
      address: consumer.address,
      type: consumer.type,
      credit_limit: consumer.credit_limit,
      createdAt: consumer.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update consumer
router.put("/:id", async (req, res) => {
  try {
    const { name, phone, address, type, credit_limit } = req.body;

    const consumer = await Consumer.findOneAndUpdate(
      scopedFilter(req, { _id: req.params.id }),
      {
        name,
        phone,
        address,
        type,
        credit_limit,
      },
      { new: true }
    );

    if (!consumer) return res.status(404).json({ error: "Consumer not found" });

    res.json({
      id: consumer._id,
      name: consumer.name,
      phone: consumer.phone,
      address: consumer.address,
      type: consumer.type,
      credit_limit: consumer.credit_limit,
      createdAt: consumer.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete consumer
router.delete("/:id", async (req, res) => {
  try {
    await Consumer.findOneAndDelete(scopedFilter(req, { _id: req.params.id }));
    res.json({ message: "Consumer deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get consumer payment summary
router.get("/:id/summary", async (req, res) => {
  try {
    const { tenantId, id } = req.user;
    const adminId = id;
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
    const consumerObjectId = new mongoose.Types.ObjectId(req.params.id);

    const [totalOwed, totalPaid, pendingSales] = await Promise.all([
      ConsumerSale.aggregate([
        { $match: { tenantId: tenantObjectId, consumerId: consumerObjectId, ...(adminId ? { adminId: new mongoose.Types.ObjectId(adminId) } : {}) } },
        { $group: { _id: null, amount: { $sum: "$total" } } }
      ]),
      ConsumerPayment.aggregate([
        { $match: { tenantId: tenantObjectId, consumerId: consumerObjectId, ...(adminId ? { adminId: new mongoose.Types.ObjectId(adminId) } : {}) } },
        { $group: { _id: null, amount: { $sum: "$amount" } } }
      ]),
      ConsumerSale.aggregate([
        { $match: { tenantId: tenantObjectId, consumerId: consumerObjectId, payment_status: 'pending', ...(adminId ? { adminId: new mongoose.Types.ObjectId(adminId) } : {}) } },
        { $group: { _id: null, amount: { $sum: "$total" } } }
      ])
    ]);

    const totalOwedAmount = totalOwed[0]?.amount || 0;
    const totalPaidAmount = totalPaid[0]?.amount || 0;
    const pendingSalesAmount = pendingSales[0]?.amount || 0;
    const outstanding = totalOwedAmount - totalPaidAmount;

    res.json({
      consumerId: req.params.id,
      totalOwed: totalOwedAmount,
      totalPaid: totalPaidAmount,
      outstanding,
      pendingSales: pendingSalesAmount,
      status: outstanding > 0 ? 'has_balance' : 'settled'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;