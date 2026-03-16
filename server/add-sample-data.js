const mongoose = require("mongoose");
require("dotenv").config();

const Consumer = require("./models/Consumer");
const ConsumerSale = require("./models/ConsumerSale");
const ConsumerPayment = require("./models/ConsumerPayment");

async function addSampleData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      tls: true,
      retryWrites: true
    });
    console.log("Connected to MongoDB");

    // Sample Consumers
    const consumers = [
      {
        name: "Rahul Sharma",
        phone: "9876543210",
        address: "123 Main St, Delhi",
        credit_limit: 5000,
        current_balance: 1200
      },
      {
        name: "Priya Patel",
        phone: "8765432109",
        address: "456 Oak Ave, Mumbai",
        credit_limit: 3000,
        current_balance: -500
      },
      {
        name: "Amit Kumar",
        phone: "7654321098",
        address: "789 Pine Rd, Bangalore",
        credit_limit: 4000,
        current_balance: 800
      }
    ];

    const insertedConsumers = await Consumer.insertMany(consumers);
    console.log("Added consumers:", insertedConsumers.length);

    // Sample Consumer Sales
    const sales = [
      {
        consumerId: insertedConsumers[0]._id,
        litres: 10,
        rate: 50,
        total: 500,
        payment_status: "pending",
        sale_date: new Date("2024-03-15")
      },
      {
        consumerId: insertedConsumers[1]._id,
        litres: 5,
        rate: 52,
        total: 260,
        payment_status: "paid",
        sale_date: new Date("2024-03-14")
      },
      {
        consumerId: insertedConsumers[2]._id,
        litres: 8,
        rate: 48,
        total: 384,
        payment_status: "pending",
        sale_date: new Date("2024-03-13")
      }
    ];

    const insertedSales = await ConsumerSale.insertMany(sales);
    console.log("Added consumer sales:", insertedSales.length);

    // Sample Consumer Payments
    const payments = [
      {
        consumerId: insertedConsumers[1]._id,
        amount: 260,
        date: new Date("2024-03-14"),
        payment_method: "cash",
        notes: "Full payment for sale"
      },
      {
        consumerId: insertedConsumers[0]._id,
        amount: 300,
        date: new Date("2024-03-15"),
        payment_method: "upi",
        notes: "Partial payment"
      }
    ];

    const insertedPayments = await ConsumerPayment.insertMany(payments);
    console.log("Added consumer payments:", insertedPayments.length);

    console.log("Sample data added successfully!");
  } catch (error) {
    console.error("Error adding sample data:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

addSampleData();