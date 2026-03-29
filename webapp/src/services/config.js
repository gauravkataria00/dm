const defaultApiBaseUrl = import.meta.env.PROD
  ? "https://dairy-backend-pw3n.onrender.com"
  : "http://localhost:5000";

const rawApiBaseUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  defaultApiBaseUrl;

const normalizeApiBaseUrl = (value) => {
  const trimmed = String(value || "").trim();

  if (!trimmed) {
    return defaultApiBaseUrl;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, "").replace(/\/api$/i, "");
  }

  if (/^localhost:\d+$/i.test(trimmed)) {
    return `http://${trimmed}`;
  }

  if (/^:\d+$/.test(trimmed)) {
    return `http://localhost${trimmed}`;
  }

  return trimmed.replace(/\/+$/, "").replace(/\/api$/i, "");
};

export const API_BASE_URL = normalizeApiBaseUrl(rawApiBaseUrl);

console.log("API URL:", API_BASE_URL);

const fallbackRawBaseUrl =
  import.meta.env.VITE_API_FALLBACK_URL || "https://dairy-backend-pw3n.onrender.com";

export const API_FALLBACK_BASE_URL = normalizeApiBaseUrl(fallbackRawBaseUrl);
