import { useState } from 'react'
import { FaPlus, FaEdit, FaTrash, FaLeaf, FaDrumstickBite, FaStar, FaSearch } from 'react-icons/fa'
import { useMenu } from '../../context/MenuContext'
import { AdminSidebar } from './Dashboard'
import MenuModal from '../../components/MenuModal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useDebounce } from '../../hooks/useDebounce'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const CATEGORIES = ['All', 'Starters', 'Mains', 'Desserts', 'Drinks']

export default function MenuManager() {
    const { menuItems, addItem, updateItem, deleteItem } = useMenu()
    const [filter, setFilter] = useState('All')
    const [search, setSearch] = useState('')
    const debSearch = useDebounce(search, 350)
    const [modalOpen, setModalOpen] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [confirm, setConfirm] = useState(null)

    const filtered = menuItems.filter(i => {
        const matchCat = filter === 'All' || i.category === filter
        const q = debSearch.toLowerCase()
        const matchSearch = !q || i.name?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)
        return matchCat && matchSearch
    })

    const handleSave = async (item) => {
        try {
            if (editItem) await updateItem(editItem._id, item)
            else await addItem(item)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Action failed')
        }
    }

    const handleEdit = (item) => { setEditItem(item); setModalOpen(true) }
    const handleDelete = async (id) => {
        try {
            await deleteItem(id)
        } catch { toast.error('Failed to delete item') }
        setConfirm(null)
    }
    const openAdd = () => { setEditItem(null); setModalOpen(true) }

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <div className="admin-main">
                <div className="admin-topbar" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--cream)', fontSize: '1.4rem' }}>Menu Manager</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{filtered.length} of {menuItems.length} dishes</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                        <div className="admin-search-wrap">
                            <FaSearch className="admin-search-icon" />
                            <input className="admin-search" placeholder="Search dishes…" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <button className="btn btn-gold" onClick={openAdd}><FaPlus /> Add Dish</button>
                    </div>
                </div>

                <div className="admin-content">
                    {/* Category Filter */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                className={`cat-tab${filter === cat ? ' active' : ''}`}
                                onClick={() => setFilter(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Type</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {filtered.map(item => (
                                        <motion.tr
                                            key={item._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <td>
                                                <img src={item.image} alt={item.name} style={{ width: 54, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(212,168,67,0.15)' }} />
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 500, color: 'var(--cream)' }}>{item.name}</div>
                                                {item.featured && <span className="badge badge-gold" style={{ marginTop: 3 }}><FaStar style={{ fontSize: '0.65rem' }} /> Chef's Pick</span>}
                                            </td>
                                            <td><span className="badge badge-gold">{item.category}</span></td>
                                            <td style={{ color: 'var(--gold)', fontWeight: 600 }}>₹{item.price.toLocaleString()}</td>
                                            <td>
                                                <span className={`badge ${item.isVeg ? 'badge-veg' : 'badge-nonveg'}`}>
                                                    {item.isVeg ? <><FaLeaf /> Veg</> : <><FaDrumstickBite /> Non-Veg</>}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn btn-outline btn-sm" onClick={() => handleEdit(item)}><FaEdit /></button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => setConfirm({ id: item._id, name: item.name })}><FaTrash /></button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {modalOpen && (
                <MenuModal
                    item={editItem}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                />
            )}

            {confirm && (
                <ConfirmDialog
                    icon="🗑️"
                    title="Delete Dish?"
                    message={`Remove "${confirm.name}" from the menu? This cannot be undone.`}
                    confirmText="Yes, Delete"
                    onConfirm={() => handleDelete(confirm.id)}
                    onCancel={() => setConfirm(null)}
                />
            )}

            <style>{`
        .cat-tab {
          padding: 0.45rem 1.1rem;
          border-radius: 100px;
          border: 1.5px solid rgba(212,168,67,0.2);
          background: transparent;
          color: var(--text-muted);
          font-size: 0.83rem;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
          font-family: var(--font-body);
        }
        .cat-tab:hover { border-color: var(--gold); color: var(--gold); }
        .cat-tab.active { background: var(--gold); color: var(--dark); border-color: var(--gold); font-weight: 600; }
      `}</style>
        </div>
    )
}
