import { API_BASE_URL, API_FALLBACK_BASE_URL } from "./config";

const API_BASE_URL_WITH_API = `${API_BASE_URL}/api`;
const nativeFetch = globalThis.fetch.bind(globalThis);
const DEV_MODE = import.meta.env.DEV;
const GET_CACHE_TTL_MS = 30000;
const getRequestCache = new Map();

const logError = (...args) => {
  if (DEV_MODE) {
    console.error(...args);
  }
};

const logWarn = (...args) => {
  if (DEV_MODE) {
    console.warn(...args);
  }
};

const clearGetCache = () => {
  getRequestCache.clear();
};

const getCacheEntry = (key) => {
  const cached = getRequestCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    getRequestCache.delete(key);
    return null;
  }
  return cached.value;
};

const setCacheEntry = (key, value, ttlMs = GET_CACHE_TTL_MS) => {
  getRequestCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
};

const getAuthToken = () => localStorage.getItem("token") || "";

const fetch = (input, init = {}) => {
  const method = String(init.method || "GET").toUpperCase();
  if (method !== "GET") {
    clearGetCache();
  }

  const token = getAuthToken();

  if (!token) {
    const message = "Authentication token missing. Please login again.";
    logError(message);
    if (typeof window !== "undefined") {
      window.alert(message);
      if (!window.location.hash.includes("/login")) {
        window.location.href = "/#/login";
      }
    }
    return Promise.reject(new Error(message));
  }

  const incomingHeaders = init.headers || {};
  const headers = new Headers(incomingHeaders);
  headers.set("Authorization", `Bearer ${token}`);

  return nativeFetch(input, {
    ...init,
    headers,
  });
};

const parseErrorMessage = async (response, fallbackMessage) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => ({}));
    return payload?.error || payload?.message || `${fallbackMessage} (${response.status})`;
  }

  const text = await response.text().catch(() => "");
  return text || `${fallbackMessage} (${response.status})`;
};

const postJson = async (url, body, fallbackMessage) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, fallbackMessage));
  }

  return response.json();
};

const getJsonWithCache = async (url, fallbackMessage, options = {}) => {
  const { ttlMs = GET_CACHE_TTL_MS, asArray = false } = options;
  const cacheKey = `GET:${url}`;
  const cached = getCacheEntry(cacheKey);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, fallbackMessage));
  }

  const data = await response.json();
  const resolved = asArray
    ? Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : []
    : data;

  if (asArray && !Array.isArray(data) && !Array.isArray(data?.data)) {
    logWarn("Unexpected response format for", url, data);
  }

  setCacheEntry(cacheKey, resolved, ttlMs);
  return resolved;
};

// Get all clients
export const getClients = async () => {
  try {
    return await getJsonWithCache(`${API_BASE_URL_WITH_API}/clients`, "Failed to fetch clients", { asArray: true });
  } catch (error) {
    logError("Error fetching clients:", error);
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
    return await postJson(`${API_BASE_URL_WITH_API}/clients`, clientData, "Failed to create client");
  } catch (error) {
    console.error("Create error:", error);
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
    return await getJsonWithCache(`${API_BASE_URL_WITH_API}/milk`, "Failed to fetch milk entries", { asArray: true });
  } catch (error) {
    logError("Error fetching milk entries:", error);
    throw error;
  }
};

export const createMilkEntry = async (entryData) => {
  try {
    return await postJson(`${API_BASE_URL_WITH_API}/milk`, entryData, "Failed to create milk entry");
  } catch (error) {
    console.error("Create error:", error);
    throw error;
  }
};

export const deleteMilkEntry = async (entryId) => {
  const primaryUrl = `${API_BASE_URL_WITH_API}/milk/${entryId}`;
  const fallbackBase = `${API_FALLBACK_BASE_URL}/api`;
  const fallbackUrl = `${fallbackBase}/milk/${entryId}`;

  const requestOptions = {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  };

  let response;

  try {
    response = await fetch(primaryUrl, requestOptions);
  } catch (error) {
    if (API_FALLBACK_BASE_URL && API_FALLBACK_BASE_URL !== API_BASE_URL) {
      response = await fetch(fallbackUrl, requestOptions);
    } else {
      throw error;
    }
  }

  if (!response.ok && response.status >= 500 && API_FALLBACK_BASE_URL && API_FALLBACK_BASE_URL !== API_BASE_URL) {
    response = await fetch(fallbackUrl, requestOptions);
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = isJson
      ? payload?.error || payload?.message || `Delete failed (${response.status})`
      : `Delete failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
};

// Settlements
export const getSettlements = async () => {
  try {
    return await getJsonWithCache(`${API_BASE_URL_WITH_API}/settlements`, "Failed to fetch settlements", { asArray: true });
  } catch (error) {
    logError("Error fetching settlements:", error);
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
    return await postJson(`${API_BASE_URL_WITH_API}/settlements`, settlementData, "Failed to create settlement");
  } catch (error) {
    console.error("Create error:", error);
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
    return await getJsonWithCache(`${API_BASE_URL_WITH_API}/payments`, "Failed to fetch payments", { asArray: true });
  } catch (error) {
    logError("Error fetching payments:", error);
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
    return await postJson(`${API_BASE_URL_WITH_API}/payments`, paymentData, "Failed to create payment");
  } catch (error) {
    console.error("Create error:", error);
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
    return await getJsonWithCache(`${API_BASE_URL_WITH_API}/advances`, "Failed to fetch advances", { asArray: true });
  } catch (error) {
    logError("Error fetching advances:", error);
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
    return await postJson(`${API_BASE_URL_WITH_API}/advances`, advanceData, "Failed to create advance");
  } catch (error) {
    console.error("Create error:", error);
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
    return await postJson(`${API_BASE_URL_WITH_API}/consumers`, consumerData, "Failed to create consumer");
  } catch (error) {
    console.error("Create error:", error);
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
    return await getJsonWithCache(`${API_BASE_URL_WITH_API}/consumer-sales`, "Failed to fetch consumer sales", { asArray: true });
  } catch (error) {
    logError("Error fetching consumer sales:", error);
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
    return await postJson(`${API_BASE_URL_WITH_API}/consumer-sales`, saleData, "Failed to create consumer sale");
  } catch (error) {
    console.error("Create error:", error);
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
    return await postJson(`${API_BASE_URL_WITH_API}/consumer-payments`, paymentData, "Failed to create consumer payment");
  } catch (error) {
    console.error("Create error:", error);
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
    return await getJsonWithCache(`${API_BASE_URL_WITH_API}/inventory`, "Failed to fetch inventory", { asArray: true });
  } catch (error) {
    logError("Error fetching inventory:", error);
    throw error;
  }
};

export const getTodayInventory = async () => {
  try {
    return await getJsonWithCache(`${API_BASE_URL_WITH_API}/inventory/today`, "Failed to fetch today's inventory");
  } catch (error) {
    logError("Error fetching today's inventory:", error);
    throw error;
  }
};

export const createInventoryRecord = async (inventoryData) => {
  try {
    return await postJson(`${API_BASE_URL_WITH_API}/inventory`, inventoryData, "Failed to create inventory record");
  } catch (error) {
    console.error("Create error:", error);
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
