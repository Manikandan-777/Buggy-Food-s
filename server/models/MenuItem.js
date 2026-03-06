const mongoose = require('mongoose')

const MenuItemSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Dish name is required'], trim: true },
    category: { type: String, required: true, enum: ['Starters', 'Mains', 'Desserts', 'Drinks'] },
    price: { type: Number, required: true, min: 1 },
    description: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    isVeg: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    // ── ML / Analytics Fields ────────────────────────────
    orderCount: { type: Number, default: 0 },          // incremented per booking
    tags: { type: [String], default: [] },        // e.g. ["spicy","creamy","south-indian"]
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
}, { timestamps: true })

// Performance indexes
MenuItemSchema.index({ category: 1 })
MenuItemSchema.index({ featured: 1 })
MenuItemSchema.index({ orderCount: -1 })           // fast popular queries
// Text search index
MenuItemSchema.index({ name: 'text', description: 'text' }, { weights: { name: 10, description: 5 } })

module.exports = mongoose.model('MenuItem', MenuItemSchema)

