// Simple in-memory cache
const cache = new Map()

/**
 * @param {number} ttlMs - Time-to-live in milliseconds (default 60s)
 */
const cacheMiddleware = (ttlMs = 60000) => (req, res, next) => {
    const key = req.originalUrl

    if (cache.has(key)) {
        const { data, ts } = cache.get(key)
        if (Date.now() - ts < ttlMs) {
            res.setHeader('X-Cache', 'HIT')
            return res.json(data)
        }
        cache.delete(key)
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res)
    res.json = (data) => {
        if (data?.success) cache.set(key, { data, ts: Date.now() })
        originalJson(data)
    }

    res.setHeader('X-Cache', 'MISS')
    next()
}

const clearCache = (pattern) => {
    for (const key of cache.keys()) {
        if (key.startsWith(pattern)) cache.delete(key)
    }
}

module.exports = { cacheMiddleware, clearCache }
