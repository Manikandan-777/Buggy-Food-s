const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const Contact = require('../models/Contact')
const { protect } = require('../middleware/auth')

// @route   GET /api/contact
// @desc    Get all enquiries
// @access  Private (Admin)
router.get('/', protect, async (req, res) => {
    try {
        const enquiries = await Contact.find().sort({ createdAt: -1 })
        res.json({ success: true, count: enquiries.length, data: enquiries })
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

// @route   POST /api/contact
// @desc    Submit contact enquiry
// @access  Public
router.post(
    '/',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('subject').trim().notEmpty().withMessage('Subject is required'),
        body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() })
        }
        try {
            const enquiry = await Contact.create(req.body)
            res.status(201).json({
                success: true,
                message: 'Enquiry submitted successfully. We will get back to you soon!',
                data: enquiry,
            })
        } catch (err) {
            console.error('POST /contact error:', err)
            res.status(500).json({ success: false, message: 'Server error' })
        }
    }
)

// @route   PUT /api/contact/:id/read
// @desc    Mark enquiry as read
// @access  Private (Admin)
router.put('/:id/read', protect, async (req, res) => {
    try {
        const enquiry = await Contact.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        )
        if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' })
        res.json({ success: true, data: enquiry })
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

// @route   DELETE /api/contact/:id
// @desc    Delete enquiry
// @access  Private (Admin)
router.delete('/:id', protect, async (req, res) => {
    try {
        const enquiry = await Contact.findByIdAndDelete(req.params.id)
        if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' })
        res.json({ success: true, message: 'Enquiry deleted' })
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

module.exports = router
