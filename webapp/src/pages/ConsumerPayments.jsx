import React, { useState, useEffect } from "react";
import { getConsumerPayments, getConsumers, createConsumerPayment, getConsumerPaymentSummary } from "../services/api";

const ConsumerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [consumers, setConsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedConsumer, setSelectedConsumer] = useState(null);
  const [consumerSummary, setConsumerSummary] = useState(null);
  const [formData, setFormData] = useState({
    consumer_id: "",
    amount: "",
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: "cash",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, consumersData] = await Promise.all([
        getConsumerPayments(),
        getConsumers(),
      ]);
      setPayments(paymentsData);
      setConsumers(consumersData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConsumerSelect = async (consumerId) => {
    if (consumerId) {
      try {
        const summary = await getConsumerPaymentSummary(consumerId);
        setConsumerSummary(summary);
        setSelectedConsumer(consumers.find(c => c.id === consumerId));
        setFormData({ ...formData, consumer_id: consumerId });
      } catch (error) {
        console.error("Error loading consumer summary:", error);
      }
    } else {
      setConsumerSummary(null);
      setSelectedConsumer(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      await createConsumerPayment(paymentData);
      const consumer = consumers.find(c => c.id === formData.consumer_id);
      if (consumer && consumer.phone) {
        const message = `Payment of ₹${formData.amount} received on ${formData.payment_date}. Notes: ${formData.notes || 'None'}`;
        let phone = consumer.phone;
        if (!phone.startsWith('+')) {
          phone = '+91' + phone;
        }
        const whatsappUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
      await loadData();
      setShowForm(false);
      setFormData({
        consumer_id: "",
        amount: "",
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: "cash",
        notes: "",
      });
      setConsumerSummary(null);
      setSelectedConsumer(null);
    } catch (error) {
      console.error("Error creating payment:", error);
    }
  };

  const getConsumerName = (consumerId) => {
    const consumer = consumers.find(c => c.id === consumerId);
    return consumer ? consumer.name : "Unknown";
  };

  const getPaymentMethodBadge = (method) => {
    const methodClasses = {
      cash: "bg-green-100 text-green-800",
      card: "bg-blue-100 text-blue-800",
      bank_transfer: "bg-purple-100 text-purple-800",
      upi: "bg-orange-100 text-orange-800",
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${methodClasses[method] || "bg-gray-100 text-gray-800"}`}>
        {method.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Consumer Payments</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Record Payment
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Record New Payment</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consumer *
                </label>
                <select
                  required
                  value={formData.consumer_id}
                  onChange={(e) => {
                    setFormData({ ...formData, consumer_id: e.target.value });
                    handleConsumerSelect(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Consumer</option>
                  {consumers.map((consumer) => (
                    <option key={consumer.id} value={consumer.id}>
                      {consumer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional notes about the payment..."
                />
              </div>
            </div>

            {consumerSummary && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Consumer Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total Sales:</span>
                    <span className="ml-2 font-medium">₹{consumerSummary.total_sales?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Payments:</span>
                    <span className="ml-2 font-medium">₹{consumerSummary.total_payments?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Outstanding:</span>
                    <span className={`ml-2 font-medium ${consumerSummary.outstanding_balance > 0 ? "text-red-600" : "text-green-600"}`}>
                      ₹{consumerSummary.outstanding_balance?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Credit Limit:</span>
                    <span className="ml-2 font-medium">₹{selectedConsumer?.credit_limit?.toFixed(2) || "0.00"}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setConsumerSummary(null);
                  setSelectedConsumer(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Payment Records</h2>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consumer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount (₹)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getConsumerName(payment.consumer_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ₹{payment.amount?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPaymentMethodBadge(payment.payment_method)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {payment.notes || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {payments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No payment records found. Record your first payment to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumerPayments;