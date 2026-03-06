const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const Admin = require('../models/Admin')
const { protect } = require('../middleware/auth')

const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
}

// POST /api/auth/login
router.post('/login',
    [
        body('username').trim().notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

        const { username, password } = req.body
        try {
            const admin = await Admin.findOne({ username: username.toLowerCase() })
            if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials' })

            const isMatch = await admin.matchPassword(password)
            if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' })

            const token = jwt.sign(
                { id: admin._id, username: admin.username },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            )

            res.cookie('adminToken', token, cookieOpts)
            res.json({ success: true, token, admin: { id: admin._id, username: admin.username } })
        } catch (err) {
            console.error('Auth error:', err)
            res.status(500).json({ success: false, message: 'Server error' })
        }
    }
)

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
    res.cookie('adminToken', '', { ...cookieOpts, maxAge: 0 })
    res.json({ success: true, message: 'Logged out successfully' })
})

// GET /api/auth/verify
router.get('/verify', protect, (req, res) => {
    res.json({ success: true, admin: req.admin })
})

module.exports = router
