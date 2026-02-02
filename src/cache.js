/**
 * CacheManager - Advanced caching system with TTL, statistics, and monitoring
 * Features:
 * - 60-second TTL (configurable)
 * - LRU eviction policy (optional)
 * - Detailed statistics
 * - Automatic cleanup
 * - Size limits
 * - Serialization/deserialization
 * - Event emitters for monitoring
 */
const EventEmitter = require('events');

class CacheManager extends EventEmitter {
  /**
   * Create a new CacheManager
   * @param {Object} options - Configuration options
   * @param {number} options.ttl - Time to live in milliseconds (default: 60000)
   * @param {number} options.maxSize - Maximum number of items in cache
   * @param {number} options.maxMemoryMB - Maximum memory usage in MB
   * @param {boolean} options.enableLRU - Enable LRU eviction when limits reached
   */
  constructor(options = {}) {
    super();
    
    this.ttl = options.ttl || 60000; // 60 seconds default
    this.maxSize = options.maxSize || 1000; // Maximum items
    this.maxMemoryMB = options.maxMemoryMB || 10; // 10MB default
    this.enableLRU = options.enableLRU !== false; // Enable LRU by default
    
    // Main cache storage
    this.cache = new Map();
    
    // LRU tracking
    this.accessOrder = new Map(); // Track access order for LRU
    
    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: {
        ttl: 0,
        lru: 0,
        size: 0,
        memory: 0
      },
      totalItemsProcessed: 0,
      errors: 0,
      startTime: Date.now()
    };
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
    
    // Emit startup event
    this.emit('cache:start', { 
      ttl: this.ttl, 
      maxSize: this.maxSize, 
      maxMemoryMB: this.maxMemoryMB 
    });
  }

  /**
   * Get item from cache
   * @param {string} key - Cache key
   * @returns {object|null} - Cached data or null
   */
  get(key) {
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        this.stats.misses++;
        this.emit('cache:miss', { key });
        return null;
      }
      
      // Check if entry is expired
      if (Date.now() > entry.expiry) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
        this.stats.evictions.ttl++;
        this.stats.misses++;
        this.emit('cache:expired', { key, entry });
        return null;
      }
      
      // Update LRU access order
      if (this.enableLRU) {
        this.accessOrder.set(key, Date.now());
      }
      
      this.stats.hits++;
      this.emit('cache:hit', { key, entry });
      
      return entry.data;
    } catch (error) {
      this.stats.errors++;
      this.emit('cache:error', { key, error });
      return null;
    }
  }

  /**
   * Set item in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} customTTL - Custom TTL in milliseconds (optional)
   * @returns {CacheManager} - For chaining
   */
  set(key, data, customTTL = null) {
    try {
      // Check if we need to evict items due to size limits
      this.checkAndEvict();
      
      const ttl = customTTL || this.ttl;
      const expiry = Date.now() + ttl;
      
      const entry = {
        data,
        expiry,
        size: this.calculateSize(data),
        createdAt: Date.now(),
        accessCount: 0
      };
      
      // Store in cache
      this.cache.set(key, entry);
      
      // Update LRU
      if (this.enableLRU) {
        this.accessOrder.set(key, Date.now());
      }
      
      // Update stats
      this.stats.sets++;
      this.stats.totalItemsProcessed++;
      
      this.emit('cache:set', { key, entry, ttl });
      
      return this;
    } catch (error) {
      this.stats.errors++;
      this.emit('cache:error', { key, error });
      return this;
    }
  }

  /**
   * Set multiple items at once
   * @param {Array} items - Array of {key, value} objects
   * @param {number} ttl - TTL for all items
   * @returns {CacheManager}
   */
  setMany(items, ttl = null) {
    items.forEach(item => {
      this.set(item.key, item.value, ttl);
    });
    return this;
  }

  /**
   * Get multiple items
   * @param {Array} keys - Array of keys
   * @returns {Object} - Object with key-value pairs
   */
  getMany(keys) {
    const result = {};
    keys.forEach(key => {
      const value = this.get(key);
      if (value !== null) {
        result[key] = value;
      }
    });
    return result;
  }

  /**
   * Delete item from cache
   * @param {string} key - Cache key
   * @returns {boolean} - True if deleted, false if not found
   */
  delete(key) {
    try {
      const deleted = this.cache.delete(key);
      this.accessOrder.delete(key);
      
      if (deleted) {
        this.stats.deletes++;
        this.emit('cache:delete', { key });
      }
      
      return deleted;
    } catch (error) {
      this.stats.errors++;
      this.emit('cache:error', { key, error });
      return false;
    }
  }

  /**
   * Clear all cache
   * @returns {number} - Number of items cleared
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.accessOrder.clear();
    this.emit('cache:clear', { cleared: size });
    return size;
  }

  /**
   * Clean expired entries
   * @returns {number} - Number of entries cleaned
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
        cleaned++;
        this.stats.evictions.ttl++;
      }
    }
    
    if (cleaned > 0) {
      this.emit('cache:cleanup', { cleaned });
    }
    
    return cleaned;
  }

  /**
   * Check and evict items if limits are exceeded
   * @private
   */
  checkAndEvict() {
    // Check size limit
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    // Check memory limit
    if (this.getSizeMB() >= this.maxMemoryMB) {
      this.evictBySize();
    }
  }

  /**
   * Evict least recently used items
   * @private
   */
  evictLRU() {
    if (!this.enableLRU || this.accessOrder.size === 0) return;
    
    // Sort by access time (oldest first)
    const sortedEntries = Array.from(this.accessOrder.entries())
      .sort((a, b) => a[1] - b[1]);
    
    // Evict 10% of items or at least 1
    const evictCount = Math.max(1, Math.floor(this.cache.size * 0.1));
    
    for (let i = 0; i < Math.min(evictCount, sortedEntries.length); i++) {
      const [key] = sortedEntries[i];
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.stats.evictions.lru++;
    }
    
    if (evictCount > 0) {
      this.emit('cache:evict:lru', { count: evictCount });
    }
  }

  /**
   * Evict items by size (largest first)
   * @private
   */
  evictBySize() {
    const entries = Array.from(this.cache.entries());
    
    // Sort by size (largest first)
    entries.sort((a, b) => b[1].size - a[1].size);
    
    // Evict until we're under 80% of memory limit
    const targetMemoryMB = this.maxMemoryMB * 0.8;
    let evicted = 0;
    
    while (this.getSizeMB() > targetMemoryMB && entries.length > 0) {
      const [key] = entries.shift();
      this.cache.delete(key);
      this.accessOrder.delete(key);
      evicted++;
      this.stats.evictions.memory++;
    }
    
    if (evicted > 0) {
      this.emit('cache:evict:memory', { count: evicted });
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} - Detailed statistics
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalSize = 0;
    let oldestEntry = null;
    let newestEntry = null;
    
    for (const [key, entry] of this.cache.entries()) {
      totalSize += entry.size + key.length;
      
      if (now > entry.expiry) {
        expiredCount++;
      }
      
      if (!oldestEntry || entry.createdAt < oldestEntry.createdAt) {
        oldestEntry = { key, ...entry };
      }
      
      if (!newestEntry || entry.createdAt > newestEntry.createdAt) {
        newestEntry = { key, ...entry };
      }
    }
    
    const totalAccesses = this.stats.hits + this.stats.misses;
    const hitRate = totalAccesses > 0 ? (this.stats.hits / totalAccesses) : 0;
    const uptime = now - this.stats.startTime;
    
    return {
      // Basic info
      size: this.cache.size,
      ttlMs: this.ttl,
      maxSize: this.maxSize,
      maxMemoryMB: this.maxMemoryMB,
      
      // Memory usage
      totalSizeBytes: totalSize,
      sizeMB: this.getSizeMB(),
      memoryUsagePercent: (this.getSizeMB() / this.maxMemoryMB) * 100,
      
      // Statistics
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      errors: this.stats.errors,
      totalItemsProcessed: this.stats.totalItemsProcessed,
      
      // Eviction stats
      evictions: {
        total: Object.values(this.stats.evictions).reduce((a, b) => a + b, 0),
        ttl: this.stats.evictions.ttl,
        lru: this.stats.evictions.lru,
        size: this.stats.evictions.size,
        memory: this.stats.evictions.memory
      },
      
      // Performance
      hitRate: parseFloat(hitRate.toFixed(3)),
      missRate: parseFloat((1 - hitRate).toFixed(3)),
      
      // Entry info
      expiredEntries: expiredCount,
      validEntries: this.cache.size - expiredCount,
      
      // Timing
      oldestEntry: oldestEntry ? {
        key: oldestEntry.key,
        age: now - oldestEntry.createdAt,
        expiresIn: oldestEntry.expiry - now
      } : null,
      newestEntry: newestEntry ? {
        key: newestEntry.key,
        age: now - newestEntry.createdAt,
        expiresIn: newestEntry.expiry - now
      } : null,
      
      // System
      uptimeMs: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      startTime: new Date(this.stats.startTime).toISOString(),
      currentTime: new Date(now).toISOString()
    };
  }

  /**
   * Get cache size in MB
   * @returns {number} - Size in megabytes
   */
  getSizeMB() {
    let totalSize = 0;
    for (const [key, entry] of this.cache.entries()) {
      totalSize += entry.size + key.length;
    }
    return totalSize / (1024 * 1024);
  }

  /**
   * Calculate size of data
   * @private
   */
  calculateSize(data) {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  /**
   * Format uptime
   * @private
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Get all cache keys
   * @returns {string[]} - Array of keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.stats.evictions.ttl++;
      return false;
    }
    
    return true;
  }

  /**
   * Get entry metadata
   * @param {string} key - Cache key
   * @returns {Object|null} - Entry metadata
   */
  getEntryInfo(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    return {
      key,
      data: entry.data,
      size: entry.size,
      createdAt: new Date(entry.createdAt).toISOString(),
      age: now - entry.createdAt,
      expiry: new Date(entry.expiry).toISOString(),
      expiresIn: entry.expiry - now,
      isExpired: now > entry.expiry,
      ttl: this.ttl
    };
  }

  /**
   * Serialize cache to JSON
   * @returns {string} - JSON string
   */
  serialize() {
    const data = {
      meta: {
        version: '1.0.0',
        serializedAt: new Date().toISOString(),
        ttl: this.ttl,
        maxSize: this.maxSize
      },
      entries: []
    };
    
    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() < entry.expiry) { // Only serialize non-expired entries
        data.entries.push({
          key,
          data: entry.data,
          expiry: entry.expiry,
          createdAt: entry.createdAt
        });
      }
    }
    
    return JSON.stringify(data);
  }

  /**
   * Deserialize cache from JSON
   * @param {string} json - JSON string
   * @returns {number} - Number of entries loaded
   */
  deserialize(json) {
    try {
      const data = JSON.parse(json);
      let loaded = 0;
      
      data.entries.forEach(entryData => {
        // Only load if not expired
        if (Date.now() < entryData.expiry) {
          this.set(entryData.key, entryData.data);
          loaded++;
        }
      });
      
      this.emit('cache:deserialize', { loaded, total: data.entries.length });
      return loaded;
    } catch (error) {
      this.stats.errors++;
      this.emit('cache:error', { error });
      return 0;
    }
  }

  /**
   * Flush expired items immediately
   * @returns {number} - Number of items flushed
   */
  flushExpired() {
    return this.cleanup();
  }

  /**
   * Reset all statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: {
        ttl: 0,
        lru: 0,
        size: 0,
        memory: 0
      },
      totalItemsProcessed: 0,
      errors: 0,
      startTime: Date.now()
    };
    
    this.emit('cache:stats:reset');
  }

  /**
   * Destroy cache instance
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
    this.accessOrder.clear();
    this.removeAllListeners();
    this.emit('cache:destroy');
  }
}

// Create and export singleton instance with default options
const cache = new CacheManager({
  ttl: 60000, // 60 seconds
  maxSize: 1000,
  maxMemoryMB: 10,
  enableLRU: true
});

// Listen to events for monitoring
cache.on('cache:hit', ({ key }) => {
  console.debug(`Cache hit: ${key}`);
});

cache.on('cache:miss', ({ key }) => {
  console.debug(`Cache miss: ${key}`);
});

cache.on('cache:expired', ({ key }) => {
  console.debug(`Cache expired: ${key}`);
});

cache.on('cache:cleanup', ({ cleaned }) => {
  if (cleaned > 0) {
    console.log(`Auto-cleaned ${cleaned} expired cache entries`);
  }
});

cache.on('cache:error', ({ error }) => {
  console.error('Cache error:', error);
});

module.exports = cache;