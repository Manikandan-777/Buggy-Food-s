import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaUtensils, FaCalendarAlt, FaSignOutAlt, FaTachometerAlt, FaConciergeBell, FaDownload, FaBrain } from 'react-icons/fa'
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from 'recharts'
import { useAuth } from '../../context/AuthContext'
import { useMenu } from '../../context/MenuContext'
import { useBooking } from '../../context/BookingContext'
import { useSocket } from '../../hooks/useSocket'
import toast from 'react-hot-toast'
import AIInsights from './AIInsights'
import DemandHeatmap from './DemandHeatmap'

const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
    { to: '/admin/menu', label: 'Menu Manager', icon: <FaConciergeBell /> },
    { to: '/admin/bookings', label: 'Bookings', icon: <FaCalendarAlt /> },
]

const PIE_COLORS = ['#D4AF37', '#8B1A1A', '#2ECC71', '#3498DB']

export function AdminSidebar() {
    const { logout, adminUser } = useAuth()
    const navigate = useNavigate()
    const path = window.location.pathname

    const handleLogout = async () => {
        await logout()
        toast.success('Logged out successfully')
        navigate('/admin')
    }

    return (
        <aside className="admin-sidebar">
            <div className="sidebar-logo">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--cream)' }}>
                    <FaUtensils style={{ color: 'var(--gold)' }} />
                    <span>Buggy <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Foods</em></span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.2rem', display: 'block' }}>Admin Panel</span>
                {adminUser && <div style={{ marginTop: '0.5rem', color: 'var(--gold)', fontSize: '0.82rem' }}>@{adminUser.username}</div>}
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <Link key={item.to} to={item.to} className={`sidebar-nav-item${path === item.to ? ' active' : ''}`}>
                        {item.icon} {item.label}
                    </Link>
                ))}
            </nav>

            <div style={{ padding: '0 0.75rem 1rem' }}>
                <button
                    className="sidebar-nav-item"
                    style={{ width: '100%', border: 'none', cursor: 'pointer', color: 'var(--error)', background: 'rgba(231,76,60,0.08)' }}
                    onClick={handleLogout}
                >
                    <FaSignOutAlt /> Logout
                </button>
            </div>
        </aside>
    )
}

export default function Dashboard() {
    const { menuItems, total: totalMenu } = useMenu()
    const { bookings, fetchBookings } = useBooking()
    const { isAdminLoggedIn } = useAuth()

    const pending = bookings.filter(b => b.status === 'Pending').length
    const confirmed = bookings.filter(b => b.status === 'Confirmed').length
    const cancelled = bookings.filter(b => b.status === 'Cancelled').length

    // Real-time: listen for new bookings
    useSocket('new-booking', (booking) => {
        toast.success(`🔔 New booking from ${booking.name}!`, { duration: 5000 })
        fetchBookings()
    }, isAdminLoggedIn)

    // Category breakdown for pie chart
    const catData = ['Starters', 'Mains', 'Desserts', 'Drinks'].map(cat => ({
        name: cat,
        value: menuItems.filter(i => i.category === cat).length,
    }))

    // Booking status for bar-like area chart
    const statusData = [
        { name: 'Pending', value: pending },
        { name: 'Confirmed', value: confirmed },
        { name: 'Cancelled', value: cancelled },
    ]

    const stats = [
        { label: 'Total Dishes', value: totalMenu || menuItems.length, color: 'var(--gold)', icon: <FaConciergeBell /> },
        { label: 'Total Bookings', value: bookings.length, color: '#2ECC71', icon: <FaCalendarAlt /> },
        { label: 'Pending', value: pending, color: '#F39C12', icon: <FaCalendarAlt /> },
        { label: 'Confirmed', value: confirmed, color: '#3498DB', icon: <FaCalendarAlt /> },
    ]

    const recentBookings = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <div className="admin-main">
                <div className="admin-topbar">
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--cream)', fontSize: '1.4rem' }}>Dashboard</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Welcome back! Here's today's overview.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="realtime-badge">Live</span>
                        <span style={{ background: 'rgba(46,204,113,0.12)', color: '#2ECC71', border: '1px solid rgba(46,204,113,0.2)', borderRadius: '100px', padding: '0.3rem 1rem', fontSize: '0.8rem', fontWeight: 600 }}>
                            ● Online
                        </span>
                    </div>
                </div>

                <div className="admin-content">
                    {/* Stats */}
                    <div className="grid-4" style={{ marginBottom: '2rem' }}>
                        {stats.map((s, i) => (
                            <motion.div className="stat-card" key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                                <div className="stat-icon" style={{ background: `color-mix(in srgb, ${s.color} 15%, transparent)`, color: s.color }}>
                                    {s.icon}
                                </div>
                                <div>
                                    <p className="stat-label">{s.label}</p>
                                    <p className="stat-value" style={{ color: s.color }}>{s.value}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Charts */}
                    <div className="grid-2" style={{ marginBottom: '2rem' }}>
                        {/* Booking status area chart */}
                        <div className="chart-card">
                            <p className="chart-title">Booking Overview</p>
                            <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={statusData}>
                                    <defs>
                                        <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.03} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                                    <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip contentStyle={{ background: 'var(--dark-2)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 8, color: 'var(--cream)', fontFamily: 'var(--font-body)' }} />
                                    <Area type="monotone" dataKey="value" stroke="#D4AF37" fill="url(#bookingGrad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Menu category pie chart */}
                        <div className="chart-card">
                            <p className="chart-title">Menu Categories</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <PieChart width={150} height={150}>
                                    <Pie data={catData} cx={70} cy={70} outerRadius={65} innerRadius={30} dataKey="value">
                                        {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--dark-2)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 8, color: 'var(--cream)' }} />
                                </PieChart>
                                <div style={{ flex: 1 }}>
                                    {catData.map((d, i) => (
                                        <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i], display: 'inline-block' }} />
                                                {d.name}
                                            </span>
                                            <span style={{ color: 'var(--cream)', fontWeight: 600 }}>{d.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── AI Intelligence Section ── */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                            <FaBrain style={{ color: 'var(--gold)', fontSize: '1.1rem' }} />
                            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--cream)', fontSize: '1.15rem' }}>AI Intelligence</h3>
                            <span style={{ fontSize: '0.68rem', color: 'var(--gold)', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '100px', padding: '0.15rem 0.6rem', marginLeft: '0.3rem' }}>ML Powered</span>
                        </div>
                        {/* Demand Heatmap — full width */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <DemandHeatmap />
                        </div>
                        {/* Top/Low dish insights — 2 columns */}
                        <AIInsights />
                    </div>

                    {/* Quick Actions */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                        <Link to="/admin/menu" className="btn btn-gold"><FaConciergeBell /> Manage Menu</Link>
                        <Link to="/admin/bookings" className="btn btn-outline-gold"><FaCalendarAlt /> View Bookings</Link>
                        <Link to="/menu" target="_blank" className="btn btn-outline"><FaUtensils /> View Public Menu</Link>
                    </div>

                    {/* Recent Bookings table */}
                    <div style={{ background: 'var(--dark-2)', border: '1px solid rgba(212,168,67,0.12)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                        <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(212,168,67,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--cream)', fontSize: '1.1rem' }}>Recent Bookings</h3>
                            <Link to="/admin/bookings" style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>View All →</Link>
                        </div>
                        {recentBookings.length === 0 ? (
                            <p style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>No bookings yet.</p>
                        ) : (
                            <div className="table-wrapper" style={{ border: 'none' }}>
                                <table>
                                    <thead><tr><th>Name</th><th>Date</th><th>Time</th><th>Guests</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {recentBookings.map(b => (
                                            <tr key={b._id}>
                                                <td>{b.name}</td><td>{b.date}</td><td>{b.time}</td><td>{b.guests}</td>
                                                <td><span className={`badge badge-${b.status?.toLowerCase()}`}>{b.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
