const crypto = require("crypto");

const toBase64Url = (input) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const fromBase64Url = (input) => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : "";
  return Buffer.from(normalized + padding, "base64").toString("utf8");
};

const createSalt = () => crypto.randomBytes(16).toString("hex");

const hashPassword = (password, salt) =>
  crypto.pbkdf2Sync(String(password), salt, 100000, 64, "sha512").toString("hex");

const verifyPassword = (password, salt, hash) => {
  const candidate = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
};

const sign = (payload, secret) => {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  return toBase64Url(hmac.digest());
};

const createToken = (claims, secret, expiresInHours = 24) => {
  const payload = {
    ...claims,
    exp: Date.now() + expiresInHours * 60 * 60 * 1000,
  };
  const encoded = toBase64Url(JSON.stringify(payload));
  const signature = sign(encoded, secret);
  return `${encoded}.${signature}`;
};

const verifyToken = (token, secret) => {
  const [encoded, signature] = String(token || "").split(".");
  if (!encoded || !signature) {
    throw new Error("Invalid token format");
  }

  const expected = sign(encoded, secret);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(fromBase64Url(encoded));
  if (!payload?.exp || Date.now() > payload.exp) {
    throw new Error("Token expired");
  }

  return payload;
};

module.exports = {
  createSalt,
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
};