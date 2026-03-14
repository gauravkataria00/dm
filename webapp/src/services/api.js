import { API_BASE_URL } from "./config";

const API_BASE_URL_WITH_API = `${API_BASE_URL}/api`;

// Get all clients
export const getClients = async () => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/clients`);
    if (!response.ok) throw new Error("Failed to fetch clients");
    return await response.json();
  } catch (error) {
    console.error("Error fetching clients:", error);
    throw error;
  }
};

// Get single client by ID
export const getClientById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/clients/${id}`);
    if (!response.ok) throw new Error("Failed to fetch client");
    return await response.json();
  } catch (error) {
    console.error("Error fetching client:", error);
    throw error;
  }
};

// Create new client
export const createClient = async (clientData) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clientData),
    });
    if (!response.ok) throw new Error("Failed to create client");
    return await response.json();
  } catch (error) {
    console.error("Error creating client:", error);
    throw error;
  }
};

// Update client
export const updateClient = async (id, clientData) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clientData),
    });
    if (!response.ok) throw new Error("Failed to update client");
    return await response.json();
  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
};

// Delete client
export const deleteClient = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/clients/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete client");
    return await response.json();
  } catch (error) {
    console.error("Error deleting client:", error);
    throw error;
  }
};

// Milk entries
export const getMilkEntries = async () => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/milk`);
    if (!response.ok) throw new Error("Failed to fetch milk entries");
    return await response.json();
  } catch (error) {
    console.error("Error fetching milk entries:", error);
    throw error;
  }
};

export const createMilkEntry = async (entryData) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/milk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entryData),
    });
    if (!response.ok) throw new Error("Failed to create milk entry");
    return await response.json();
  } catch (error) {
    console.error("Error creating milk entry:", error);
    throw error;
  }
};

// Settlements
export const getSettlements = async () => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/settlements`);
    if (!response.ok) throw new Error("Failed to fetch settlements");
    return await response.json();
  } catch (error) {
    console.error("Error fetching settlements:", error);
    throw error;
  }
};

export const getClientSettlements = async (clientId) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/settlements/client/${clientId}`);
    if (!response.ok) throw new Error("Failed to fetch client settlements");
    return await response.json();
  } catch (error) {
    console.error("Error fetching client settlements:", error);
    throw error;
  }
};

export const createSettlement = async (settlementData) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/settlements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settlementData),
    });
    if (!response.ok) throw new Error("Failed to create settlement");
    return await response.json();
  } catch (error) {
    console.error("Error creating settlement:", error);
    throw error;
  }
};

export const updateSettlementStatus = async (id, status) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/settlements/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error("Failed to update settlement");
    return await response.json();
  } catch (error) {
    console.error("Error updating settlement:", error);
    throw error;
  }
};

// Payments
export const getPayments = async () => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/payments`);
    if (!response.ok) throw new Error("Failed to fetch payments");
    return await response.json();
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw error;
  }
};

export const getClientPayments = async (clientId) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/payments/client/${clientId}`);
    if (!response.ok) throw new Error("Failed to fetch client payments");
    return await response.json();
  } catch (error) {
    console.error("Error fetching client payments:", error);
    throw error;
  }
};

export const createPayment = async (paymentData) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });
    if (!response.ok) throw new Error("Failed to create payment");
    return await response.json();
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};

export const getClientPaymentSummary = async (clientId) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/payments/summary/${clientId}`);
    if (!response.ok) throw new Error("Failed to fetch payment summary");
    return await response.json();
  } catch (error) {
    console.error("Error fetching payment summary:", error);
    throw error;
  }
};

// Advances
export const getAdvances = async () => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/advances`);
    if (!response.ok) throw new Error("Failed to fetch advances");
    return await response.json();
  } catch (error) {
    console.error("Error fetching advances:", error);
    throw error;
  }
};

export const getClientAdvances = async (clientId) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/advances/client/${clientId}`);
    if (!response.ok) throw new Error("Failed to fetch client advances");
    return await response.json();
  } catch (error) {
    console.error("Error fetching client advances:", error);
    throw error;
  }
};

export const createAdvance = async (advanceData) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/advances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(advanceData),
    });
    if (!response.ok) throw new Error("Failed to create advance");
    return await response.json();
  } catch (error) {
    console.error("Error creating advance:", error);
    throw error;
  }
};

export const updateAdvanceStatus = async (id, status) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/advances/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error("Failed to update advance");
    return await response.json();
  } catch (error) {
    console.error("Error updating advance:", error);
    throw error;
  }
};

// Consumers
export const getConsumers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/consumers`);
    if (!response.ok) throw new Error("Failed to fetch consumers");
    return await response.json();
  } catch (error) {
    console.error("Error fetching consumers:", error);
    throw error;
  }
};

export const getConsumerById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/consumers/${id}`);
    if (!response.ok) throw new Error("Failed to fetch consumer");
    return await response.json();
  } catch (error) {
    console.error("Error fetching consumer:", error);
    throw error;
  }
};

export const createConsumer = async (consumerData) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/consumers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(consumerData),
    });
    if (!response.ok) throw new Error("Failed to create consumer");
    return await response.json();
  } catch (error) {
    console.error("Error creating consumer:", error);
    throw error;
  }
};

export const updateConsumer = async (id, consumerData) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/consumers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(consumerData),
    });
    if (!response.ok) throw new Error("Failed to update consumer");
    return await response.json();
  } catch (error) {
    console.error("Error updating consumer:", error);
    throw error;
  }
};

export const deleteConsumer = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/consumers/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete consumer");
    return await response.json();
  } catch (error) {
    console.error("Error deleting consumer:", error);
    throw error;
  }
};

export const getConsumerSummary = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/consumers/${id}/summary`);
    if (!response.ok) throw new Error("Failed to fetch consumer summary");
    return await response.json();
  } catch (error) {
    console.error("Error fetching consumer summary:", error);
    throw error;
  }
};

// Consumer Sales
export const getConsumerSales = async () => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/consumer-sales`);
    if (!response.ok) throw new Error("Failed to fetch consumer sales");
    return await response.json();
  } catch (error) {
    console.error("Error fetching consumer sales:", error);
    throw error;
  }
};

export const getConsumerSalesByConsumer = async (consumerId) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/consumer-sales/consumer/${consumerId}`);
    if (!response.ok) throw new Error("Failed to fetch consumer sales");
    return await response.json();
  } catch (error) {
    console.error("Error fetching consumer sales:", error);
    throw error;
  }
};

export const getTodayConsumerSales = async () => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/consumer-sales/today`);
    if (!response.ok) throw new Error("Failed to fetch today's consumer sales");
    return await response.json();
  } catch (error) {
    console.error("Error fetching today's consumer sales:", error);
    throw error;
  }
};

export const createConsumerSale = async (saleData) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/consumer-sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleData),
    });
    if (!response.ok) throw new Error("Failed to create consumer sale");
    return await response.json();
  } catch (error) {
    console.error("Error creating consumer sale:", error);
    throw error;
  }
};

export const updateConsumerSaleStatus = async (id, payment_status) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/consumer-sales/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_status }),
    });
    if (!response.ok) throw new Error("Failed to update sale status");
    return await response.json();
  } catch (error) {
    console.error("Error updating sale status:", error);
    throw error;
  }
};

export const getConsumerSalesSummary = async (startDate, endDate) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/consumer-sales/summary/range?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) throw new Error("Failed to fetch sales summary");
    return await response.json();
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    throw error;
  }
};

// Consumer Payments
export const getConsumerPayments = async () => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/consumer-payments`);
    if (!response.ok) throw new Error("Failed to fetch consumer payments");
    return await response.json();
  } catch (error) {
    console.error("Error fetching consumer payments:", error);
    throw error;
  }
};

export const getConsumerPaymentsByConsumer = async (consumerId) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/consumer-payments/consumer/${consumerId}`);
    if (!response.ok) throw new Error("Failed to fetch consumer payments");
    return await response.json();
  } catch (error) {
    console.error("Error fetching consumer payments:", error);
    throw error;
  }
};

export const createConsumerPayment = async (paymentData) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/consumer-payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });
    if (!response.ok) throw new Error("Failed to create consumer payment");
    return await response.json();
  } catch (error) {
    console.error("Error creating consumer payment:", error);
    throw error;
  }
};

export const getConsumerPaymentSummary = async (consumerId) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/consumer-payments/summary/${consumerId}`);
    if (!response.ok) throw new Error("Failed to fetch payment summary");
    return await response.json();
  } catch (error) {
    console.error("Error fetching payment summary:", error);
    throw error;
  }
};

// Inventory
export const getInventory = async () => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/inventory`);
    if (!response.ok) throw new Error("Failed to fetch inventory");
    return await response.json();
  } catch (error) {
    console.error("Error fetching inventory:", error);
    throw error;
  }
};

export const getTodayInventory = async () => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/inventory/today`);
    if (!response.ok) throw new Error("Failed to fetch today's inventory");
    return await response.json();
  } catch (error) {
    console.error("Error fetching today's inventory:", error);
    throw error;
  }
};

export const createInventoryRecord = async (inventoryData) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inventoryData),
    });
    if (!response.ok) throw new Error("Failed to create inventory record");
    return await response.json();
  } catch (error) {
    console.error("Error creating inventory record:", error);
    throw error;
  }
};

export const updateInventoryRecord = async (id, inventoryData) => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/inventory/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inventoryData),
    });
    if (!response.ok) throw new Error("Failed to update inventory record");
    return await response.json();
  } catch (error) {
    console.error("Error updating inventory record:", error);
    throw error;
  }
};

export const calculateTodayInventory = async () => {
  try {
    const response = await fetch(`${API_BASE_URL_WITH_API}/inventory/calculate/today`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to calculate inventory");
    return await response.json();
  } catch (error) {
    console.error("Error calculating inventory:", error);
    throw error;
  }
};
