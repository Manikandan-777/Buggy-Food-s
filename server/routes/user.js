const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')
const { protectUser } = require('../middleware/auth')

const userCookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
}

// POST /api/user/register
router.post('/register',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

        try {
            const exists = await User.findOne({ email: req.body.email.toLowerCase() })
            if (exists) return res.status(400).json({ success: false, message: 'Email already registered' })

            const user = await User.create(req.body)
            const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })

            res.cookie('userToken', token, userCookieOpts)
            res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } })
        } catch (err) {
            console.error('Register error:', err)
            res.status(500).json({ success: false, message: 'Server error' })
        }
    }
)

// POST /api/user/login
router.post('/login',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

        try {
            const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password')
            if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' })

            const isMatch = await user.matchPassword(req.body.password)
            if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' })

            const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
            res.cookie('userToken', token, userCookieOpts)
            res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } })
        } catch (err) {
            res.status(500).json({ success: false, message: 'Server error' })
        }
    }
)

// POST /api/user/logout
router.post('/logout', (_req, res) => {
    res.cookie('userToken', '', { ...userCookieOpts, maxAge: 0 })
    res.json({ success: true, message: 'Logged out' })
})

// GET /api/user/me
router.get('/me', protectUser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        if (!user) return res.status(404).json({ success: false, message: 'User not found' })
        res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, phone: user.phone } })
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

module.exports = router
