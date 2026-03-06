const express = require('express')
const router = express.Router()
const MenuItem = require('../models/MenuItem')
const Booking = require('../models/Booking')
const { protect: authMiddleware } = require('../middleware/auth')

// ── GET /api/analytics/top-dishes ─────────────────────────────
router.get('/top-dishes', authMiddleware, async (req, res) => {
    try {
        const items = await MenuItem.find({})
            .sort({ orderCount: -1 })
            .limit(10)
            .select('name category orderCount price image isVeg')
        res.json({ success: true, data: items })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})

// ── GET /api/analytics/low-performing ─────────────────────────
router.get('/low-performing', authMiddleware, async (req, res) => {
    try {
        const items = await MenuItem.find({ orderCount: { $lt: 5 } })
            .sort({ orderCount: 1 })
            .limit(8)
            .select('name category orderCount price createdAt')
        res.json({ success: true, data: items })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})

// ── GET /api/analytics/popular-public ─────────────────────────
// Public endpoint (no auth) — for home page / menu recommendations
router.get('/popular-public', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6
        const items = await MenuItem.find({ orderCount: { $gt: 0 } })
            .sort({ orderCount: -1 })
            .limit(limit)
            .select('name category orderCount price image isVeg description featured')
        // Fallback: if no orders yet, return featured dishes
        if (items.length < limit) {
            const featured = await MenuItem.find({ featured: true }).limit(limit)
            return res.json({ success: true, data: featured, fallback: true })
        }
        res.json({ success: true, data: items })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})

// ── GET /api/analytics/booking-trends ─────────────────────────
router.get('/booking-trends', authMiddleware, async (req, res) => {
    try {
        const bookings = await Booking.find({ status: { $in: ['Confirmed', 'Pending'] } })
            .select('date status guests')
            .sort({ date: 1 })

        // Group by date
        const map = {}
        bookings.forEach(b => {
            const d = b.date
            if (!map[d]) map[d] = { date: d, total: 0, confirmed: 0, pending: 0, guests: 0 }
            map[d].total++
            map[d].guests += b.guests || 0
            if (b.status === 'Confirmed') map[d].confirmed++
            else map[d].pending++
        })
        res.json({ success: true, data: Object.values(map).slice(-30) })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})

// ── GET /api/analytics/category-stats ─────────────────────────
router.get('/category-stats', authMiddleware, async (req, res) => {
    try {
        const stats = await MenuItem.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 }, totalOrders: { $sum: '$orderCount' }, avgPrice: { $avg: '$price' } } },
            { $sort: { totalOrders: -1 } }
        ])
        res.json({ success: true, data: stats })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})

// ── GET /api/analytics/overview ───────────────────────────────
router.get('/overview', authMiddleware, async (req, res) => {
    try {
        const [totalDishes, totalBookings, pendingBookings, topDish] = await Promise.all([
            MenuItem.countDocuments(),
            Booking.countDocuments(),
            Booking.countDocuments({ status: 'Pending' }),
            MenuItem.findOne().sort({ orderCount: -1 }).select('name orderCount'),
        ])
        res.json({
            success: true,
            data: { totalDishes, totalBookings, pendingBookings, topDish }
        })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})

// ── POST /api/analytics/track-order ───────────────────────────
// Called when a booking is confirmed — increments dish orderCount
router.post('/track-order', authMiddleware, async (req, res) => {
    try {
        const { dishIds } = req.body  // array of MenuItem IDs
        if (!dishIds || !dishIds.length) return res.json({ success: true })
        await MenuItem.updateMany(
            { _id: { $in: dishIds } },
            { $inc: { orderCount: 1 } }
        )
        res.json({ success: true, message: `Tracked ${dishIds.length} dishes` })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})

module.exports = router
