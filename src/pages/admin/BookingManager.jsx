import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTrash, FaCheckCircle, FaTimesCircle, FaClock, FaFilter, FaSearch, FaDownload } from 'react-icons/fa'
import { useBooking } from '../../context/BookingContext'
import { useAuth } from '../../context/AuthContext'
import { AdminSidebar } from './Dashboard'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useSocket } from '../../hooks/useSocket'
import { useDebounce } from '../../hooks/useDebounce'
import { exportToCSV } from '../../utils/exportCSV'
import toast from 'react-hot-toast'

const STATUSES = ['All', 'Pending', 'Confirmed', 'Cancelled']

export default function BookingManager() {
    const { bookings, updateStatus, deleteBooking, fetchBookings } = useBooking()
    const { isAdminLoggedIn } = useAuth()
    const [filter, setFilter] = useState('All')
    const [search, setSearch] = useState('')
    const debSearch = useDebounce(search, 350)
    const [confirm, setConfirm] = useState(null) // { id, action }

    // Real-time new booking
    useSocket('new-booking', (booking) => {
        toast.success(`🔔 New booking from ${booking.name}!`, { duration: 5000 })
        fetchBookings()
    }, isAdminLoggedIn)

    useSocket('booking-updated', () => fetchBookings(), isAdminLoggedIn)

    // Client-side filter + search
    const filtered = bookings.filter(b => {
        const matchStatus = filter === 'All' || b.status === filter
        const q = debSearch.toLowerCase()
        const matchSearch = !q ||
            b.name?.toLowerCase().includes(q) ||
            b.email?.toLowerCase().includes(q) ||
            b.phone?.includes(q)
        return matchStatus && matchSearch
    })

    const handleStatus = async (id, status) => {
        try {
            await updateStatus(id, status)
            toast.success(`Booking ${status.toLowerCase()}`)
        } catch { toast.error('Status update failed') }
    }

    const handleDelete = async (id) => {
        try {
            await deleteBooking(id)
            toast.success('Booking removed')
        } catch { toast.error('Delete failed') }
        setConfirm(null)
    }

    const handleExport = () => {
        const exportData = filtered.map(b => ({
            Reference: `#${b._id?.slice(-6).toUpperCase()}`,
            Name: b.name,
            Email: b.email,
            Phone: b.phone,
            Date: b.date,
            Time: b.time,
            Guests: b.guests,
            Status: b.status,
            Request: b.requests || '',
        }))
        exportToCSV(exportData, `buggy-foods-bookings-${Date.now()}.csv`)
        toast.success(`Exported ${exportData.length} bookings`)
    }

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <div className="admin-main">
                <div className="admin-topbar" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--cream)', fontSize: '1.4rem' }}>Booking Manager</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{bookings.length} total · {filtered.length} showing</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="realtime-badge">Live</span>
                        {/* Search */}
                        <div className="admin-search-wrap">
                            <FaSearch className="admin-search-icon" />
                            <input className="admin-search" placeholder="Search name, email, phone…" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        {/* CSV Export */}
                        <button className="btn-export" onClick={handleExport}>
                            <FaDownload /> Export CSV
                        </button>
                    </div>
                </div>

                <div className="admin-content">
                    {/* Status filter tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <FaFilter style={{ color: 'var(--gold)', fontSize: '0.85rem' }} />
                        {STATUSES.map(s => (
                            <button key={s} className={`cat-tab${filter === s ? ' active' : ''}`}
                                onClick={() => setFilter(s)} style={{ fontSize: '0.78rem', padding: '0.35rem 0.9rem' }}>
                                {s}
                            </button>
                        ))}
                    </div>

                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
                            <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</p>
                            <p>No bookings found{filter !== 'All' ? ` with status "${filter}"` : ''}{search ? ` matching "${search}"` : ''}.</p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Ref #</th><th>Guest</th><th>Contact</th><th>Date</th>
                                        <th>Time</th><th>Guests</th><th>Status</th><th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {filtered.map(b => (
                                            <motion.tr key={b._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                <td style={{ color: 'var(--gold)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                                    #{b._id?.slice(-6).toUpperCase()}
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 500, color: 'var(--cream)' }}>{b.name}</div>
                                                    {b.requests && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} title={b.requests}>📝 {b.requests.substring(0, 24)}{b.requests.length > 24 ? '…' : ''}</div>}
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '0.85rem' }}>{b.email}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.phone}</div>
                                                </td>
                                                <td>{b.date}</td>
                                                <td>{b.time}</td>
                                                <td style={{ textAlign: 'center' }}>{b.guests}</td>
                                                <td><span className={`badge badge-${b.status?.toLowerCase()}`}>{b.status}</span></td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                        {b.status !== 'Confirmed' && (
                                                            <button className="btn btn-sm" title="Confirm"
                                                                style={{ background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.3)', color: '#2ECC71' }}
                                                                onClick={() => handleStatus(b._id, 'Confirmed')}>
                                                                <FaCheckCircle />
                                                            </button>
                                                        )}
                                                        {b.status !== 'Cancelled' && (
                                                            <button className="btn btn-sm" title="Cancel"
                                                                style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', color: '#E74C3C' }}
                                                                onClick={() => handleStatus(b._id, 'Cancelled')}>
                                                                <FaTimesCircle />
                                                            </button>
                                                        )}
                                                        {b.status !== 'Pending' && (
                                                            <button className="btn btn-sm" title="Set Pending"
                                                                style={{ background: 'rgba(243,156,18,0.1)', border: '1px solid rgba(243,156,18,0.25)', color: '#F39C12' }}
                                                                onClick={() => handleStatus(b._id, 'Pending')}>
                                                                <FaClock />
                                                            </button>
                                                        )}
                                                        <button className="btn btn-danger btn-sm" title="Delete"
                                                            onClick={() => setConfirm({ id: b._id, name: b.name })}>
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {confirm && (
                <ConfirmDialog
                    icon="🗑️"
                    title="Delete Booking?"
                    message={`Remove the reservation for "${confirm.name}"? This cannot be undone.`}
                    confirmText="Yes, Delete"
                    onConfirm={() => handleDelete(confirm.id)}
                    onCancel={() => setConfirm(null)}
                />
            )}

            <style>{`
        .cat-tab { padding:0.45rem 1.1rem; border-radius:100px; border:1.5px solid rgba(212,168,67,0.2); background:transparent; color:var(--text-muted); font-size:0.83rem; font-weight:500; cursor:pointer; transition:var(--transition); font-family:var(--font-body); }
        .cat-tab:hover { border-color:var(--gold); color:var(--gold); }
        .cat-tab.active { background:var(--gold); color:var(--dark); border-color:var(--gold); font-weight:600; }
      `}</style>
        </div>
    )
}
