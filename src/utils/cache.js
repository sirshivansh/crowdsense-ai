/**
 * Simple in-memory cache for route calculations.
 */
class RouteCache {
  constructor(timeout = 30000) { // Default 30s expiry
    this.cache = new Map();
    this.timeout = timeout;
  }

  /**
   * Generates a key for the cache based on start and end.
   */
  _genKey(start, end) {
    return `${start}->${end}`;
  }

  /**
   * Retrieves a cached route if valid.
   */
  get(start, end) {
    const key = this._genKey(start, end);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.timeout) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Stores a route in cache.
   */
  set(start, end, path) {
    const key = this._genKey(start, end);
    this.cache.set(key, {
      data: path,
      timestamp: Date.now()
    });
  }

  /**
   * Clears the entire cache.
   */
  clear() {
    this.cache.clear();
  }
}

export const routeCache = new RouteCache();
export default routeCache;
