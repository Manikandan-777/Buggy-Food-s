import { useState, useEffect } from 'react'
import { FaTimes, FaImage } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const CATEGORIES = ['Starters', 'Mains', 'Desserts', 'Drinks']

const emptyForm = {
    name: '', category: 'Starters', price: '',
    description: '', image: '', isVeg: true, featured: false
}

export default function MenuModal({ item, onClose, onSave }) {
    const [form, setForm] = useState(item ? { ...item, price: String(item.price) } : emptyForm)
    const [errors, setErrors] = useState({})

    const validate = () => {
        const e = {}
        if (!form.name.trim()) e.name = 'Name is required'
        if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Enter a valid price'
        if (!form.description.trim()) e.description = 'Description is required'
        if (!form.image.trim()) e.image = 'Image URL is required'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!validate()) return
        onSave({ ...form, price: Number(form.price) })
        toast.success(item ? 'Menu item updated!' : 'Menu item added!')
        onClose()
    }

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={e => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    className="modal"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                >
                    <div className="modal-header">
                        <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--cream)' }}>
                            {item ? 'Edit Menu Item' : 'Add New Item'}
                        </h3>
                        <button className="modal-close" onClick={onClose}><FaTimes /></button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Dish Name</label>
                            <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Truffle Risotto" />
                            {errors.name && <span className="form-error">{errors.name}</span>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="form-select" name="category" value={form.category} onChange={handleChange}>
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Price (₹)</label>
                                <input className="form-input" name="price" value={form.price} onChange={handleChange} placeholder="e.g. 450" type="number" min="1" />
                                {errors.price && <span className="form-error">{errors.price}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} placeholder="Describe the dish..." style={{ minHeight: '80px' }} />
                            {errors.description && <span className="form-error">{errors.description}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label"><FaImage style={{ marginRight: 4 }} />Image URL</label>
                            <input className="form-input" name="image" value={form.image} onChange={handleChange} placeholder="https://..." />
                            {errors.image && <span className="form-error">{errors.image}</span>}
                        </div>

                        {form.image && (
                            <img src={form.image} alt="preview" style={{ height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(212,168,67,0.2)' }} />
                        )}

                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <input type="checkbox" name="isVeg" checked={form.isVeg} onChange={handleChange} style={{ accentColor: 'var(--gold)' }} />
                                Vegetarian
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} style={{ accentColor: 'var(--gold)' }} />
                                Chef's Pick
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-gold">{item ? 'Save Changes' : 'Add Item'}</button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
