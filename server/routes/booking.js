const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const Booking = require('../models/Booking')
const { protect } = require('../middleware/auth')
const { sendBookingConfirmation } = require('../utils/sendEmail')

// GET /api/bookings — Admin only
router.get('/', protect, async (req, res) => {
    try {
        const { status, date, search, page = 1, limit = 20 } = req.query
        const filter = {}
        if (status && status !== 'All') filter.status = status
        if (date) filter.date = date
        if (search?.trim()) {
            const s = search.trim()
            filter.$or = [
                { name: { $regex: s, $options: 'i' } },
                { email: { $regex: s, $options: 'i' } },
                { phone: { $regex: s, $options: 'i' } },
            ]
        }

        const skip = (Number(page) - 1) * Number(limit)
        const [bookings, total] = await Promise.all([
            Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            Booking.countDocuments(filter),
        ])

        res.json({
            success: true, count: bookings.length, total, page: Number(page),
            totalPages: Math.ceil(total / Number(limit)), data: bookings
        })
    } catch (err) {
        console.error('GET /bookings error:', err)
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

const bookingValidation = [
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('time').notEmpty().withMessage('Time slot is required'),
    body('guests').isInt({ min: 1, max: 20 }).withMessage('Guests must be between 1–20'),
]

// POST /api/bookings — Public
router.post('/', bookingValidation, async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

    try {
        const booking = await Booking.create(req.body)

        // Emit real-time event to admin
        req.app.get('io')?.emit('new-booking', booking)

        // Send confirmation email (non-blocking)
        sendBookingConfirmation(booking).catch(err => console.error('Email error:', err))

        res.status(201).json({ success: true, data: booking })
    } catch (err) {
        console.error('POST /bookings error:', err)
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

// PUT /api/bookings/:id — Admin only
router.put('/:id', protect, async (req, res) => {
    try {
        const allowedFields = ['status', 'requests']
        const updates = {}
        allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f] })

        const booking = await Booking.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

        req.app.get('io')?.emit('booking-updated', booking)
        res.json({ success: true, data: booking })
    } catch {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

// DELETE /api/bookings/:id — Admin only
router.delete('/:id', protect, async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id)
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })
        req.app.get('io')?.emit('booking-deleted', req.params.id)
        res.json({ success: true, message: 'Booking deleted' })
    } catch {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

module.exports = router
