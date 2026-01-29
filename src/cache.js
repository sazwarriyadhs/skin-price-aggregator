const cache = new Map();
const TTL = 60000;

function get(key) {
  const entry = cache.get(key);
  if (!entry || Date.now() - entry.timestamp > TTL) {
    return null;
  }
  return entry.data;
}

function set(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

module.exports = { get, set };
