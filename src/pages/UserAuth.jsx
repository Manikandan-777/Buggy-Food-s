import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaUtensils, FaEye, FaEyeSlash } from 'react-icons/fa'
import { userAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function UserAuth() {
    const [tab, setTab] = useState('login')
    const [showPwd, setShowPwd] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (tab === 'register') {
                if (!form.name.trim()) { toast.error('Name is required'); return }
                const { data } = await userAPI.register(form)
                if (data.success) {
                    toast.success(`Welcome, ${data.user.name}! Account created 🎉`)
                    navigate('/')
                }
            } else {
                const { data } = await userAPI.login({ email: form.email, password: form.password })
                if (data.success) {
                    toast.success(`Welcome back, ${data.user.name}! 👋`)
                    navigate('/')
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <Helmet>
                <title>{tab === 'login' ? 'Login' : 'Register'} — Buggy Foods</title>
            </Helmet>

            <motion.div className="auth-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                    <FaUtensils style={{ color: 'var(--gold)', fontSize: '1.3rem' }} />
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--cream)' }}>
                        Buggy <em style={{ color: 'var(--gold)' }}>Foods</em>
                    </span>
                </div>

                {/* Tabs */}
                <div className="auth-tabs">
                    <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
                    <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Register</button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    {tab === 'register' && (
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-input" name="name" type="text" placeholder="Jane Smith" value={form.name} onChange={change} required />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input className="form-input" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={change} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="form-input"
                                name="password"
                                type={showPwd ? 'text' : 'password'}
                                placeholder={tab === 'register' ? 'Min 6 characters' : 'Your password'}
                                value={form.password}
                                onChange={change}
                                required
                                minLength={6}
                                style={{ paddingRight: '3rem' }}
                            />
                            <button type="button" onClick={() => setShowPwd(p => !p)}
                                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                {showPwd ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
                        {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: '1.5rem' }}>
                    <Link to="/" style={{ color: 'var(--gold)' }}>← Back to Home</Link>
                </p>

                {/* Admin portal link */}
                <div className="auth-admin-link">
                    Are you an admin?{' '}
                    <Link to="/admin">Login to Admin Panel →</Link>
                </div>
            </motion.div>
        </div>
    )
}
