const { AsyncLocalStorage } = require("async_hooks");

const requestContext = new AsyncLocalStorage();

const requestContextMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  requestContext.run(
    {
      requestId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      token,
      userId: req.user?.id || null,
    },
    next
  );
};

const setCurrentUserId = (userId) => {
  const store = requestContext.getStore();
  if (!store) return;
  store.userId = userId || null;
};

const getCurrentUserId = () => {
  const store = requestContext.getStore();
  return store?.userId || null;
};

const runWithUserContext = (userId, callback) => {
  const store = requestContext.getStore() || {};
  requestContext.run({
    ...store,
    userId: userId || null,
  }, callback);
};

module.exports = {
  requestContextMiddleware,
  setCurrentUserId,
  getCurrentUserId,
  runWithUserContext,
};
