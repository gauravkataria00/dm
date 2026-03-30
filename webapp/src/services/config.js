const BASE_URL = import.meta.env.VITE_API_URL || "https://dairy-backend-pw3n.onrender.com";
const defaultApiBaseUrl = BASE_URL;

const rawApiBaseUrl = BASE_URL;

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

if (import.meta.env.DEV) {
  console.log("API BASE URL:", BASE_URL);
}

const fallbackRawBaseUrl =
  import.meta.env.VITE_API_FALLBACK_URL || "https://dairy-backend-pw3n.onrender.com";

export const API_FALLBACK_BASE_URL = normalizeApiBaseUrl(fallbackRawBaseUrl);

export const DEFAULT_REPORT_WHATSAPP_PHONE =
  String(import.meta.env.VITE_REPORT_WHATSAPP_PHONE || "").replace(/\D/g, "");
