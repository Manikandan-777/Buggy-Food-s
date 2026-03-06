const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const MenuItem = require('../models/MenuItem')
const { protect } = require('../middleware/auth')
const { cacheMiddleware, clearCache } = require('../middleware/cache')

// @route   GET /api/menu
// @desc    Get all menu items with pagination, search, and filter
// @access  Public
router.get('/', cacheMiddleware(60000), async (req, res) => {
    try {
        const { category, search, featured, page = 1, limit = 12 } = req.query
        const filter = {}

        if (category && category !== 'All') filter.category = category
        if (featured === 'true') filter.featured = true
        if (search?.trim()) filter.$text = { $search: search.trim() }

        const skip = (Number(page) - 1) * Number(limit)

        const [items, total] = await Promise.all([
            MenuItem.find(filter).skip(skip).limit(Number(limit)).lean(),
            MenuItem.countDocuments(filter),
        ])

        const totalPages = Math.ceil(total / Number(limit))

        res.json({
            success: true,
            count: items.length,
            total,
            page: Number(page),
            totalPages,
            data: items,
        })
    } catch (err) {
        console.error('GET /menu error:', err)
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

// @route   GET /api/menu/:id
router.get('/:id', async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id).lean()
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' })
        res.json({ success: true, data: item })
    } catch {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

const menuValidation = [
    body('name').trim().notEmpty().withMessage('Dish name is required'),
    body('category').isIn(['Starters', 'Mains', 'Desserts', 'Drinks']).withMessage('Invalid category'),
    body('price').isFloat({ min: 1 }).withMessage('Price must be a positive number'),
    body('description').trim().notEmpty().withMessage('Description is required'),
]

// @route   POST /api/menu
// @access  Private
router.post('/', protect, menuValidation, async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

    try {
        const data = { ...req.body }
        // If image was uploaded via Multer/Cloudinary, use it
        if (req.file?.path) data.image = req.file.path

        const item = await MenuItem.create(data)
        clearCache('/api/menu')
        res.status(201).json({ success: true, data: item })
    } catch (err) {
        console.error('POST /menu error:', err)
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

// @route   PUT /api/menu/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const data = { ...req.body }
        if (req.file?.path) data.image = req.file.path

        const item = await MenuItem.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' })
        clearCache('/api/menu')
        res.json({ success: true, data: item })
    } catch {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

// @route   DELETE /api/menu/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndDelete(req.params.id)
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' })
        clearCache('/api/menu')
        res.json({ success: true, message: 'Item deleted successfully' })
    } catch {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

module.exports = router
