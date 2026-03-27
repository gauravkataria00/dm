const defaultApiBaseUrl = import.meta.env.PROD ? "" : "http://localhost:5000";

const rawApiBaseUrl =
  import.meta.env.PROD
    ? defaultApiBaseUrl
    : import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
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
