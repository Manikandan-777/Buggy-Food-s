import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaUtensils, FaUser, FaLock, FaSignInAlt, FaEye, FaEyeSlash } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const BG_IMG = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1800&q=85&auto=format'

export default function AdminLogin() {
    const [form, setForm] = useState({ username: '', password: '' })
    const [showPwd, setShowPwd] = useState(false)
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const { login, isAdminLoggedIn } = useAuth()
    const navigate = useNavigate()

    if (isAdminLoggedIn) navigate('/admin/dashboard', { replace: true })

    const change = e => {
        const { name, value } = e.target
        setForm(p => ({ ...p, [name]: value }))
        if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
    }

    const submit = async e => {
        e.preventDefault()
        const errs = {}
        if (!form.username.trim()) errs.username = 'Username required'
        if (!form.password.trim()) errs.password = 'Password required'
        if (Object.keys(errs).length) { setErrors(errs); return }

        setLoading(true)
        try {
            const res = await login(form.username, form.password)
            if (res.success) {
                toast.success('Welcome back, Admin! 🎉')
                navigate('/admin/dashboard')
            } else {
                toast.error(res.message || 'Invalid credentials')
                setErrors({ password: res.message || 'Incorrect credentials' })
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Server error. Is the backend running?'
            toast.error(msg)
            setErrors({ password: msg })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Background */}
            <div style={{ position: 'fixed', inset: 0, backgroundImage: `url(${BG_IMG})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.35)' }} />
            {/* Gradient overlay */}
            <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, rgba(18,18,18,0.92) 0%, rgba(123,30,58,0.25) 60%, rgba(18,18,18,0.92) 100%)' }} />

            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                style={{
                    position: 'relative', zIndex: 10,
                    background: 'rgba(24,24,24,0.88)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(212,175,55,0.22)',
                    borderRadius: '24px',
                    padding: '2.75rem',
                    width: '100%',
                    maxWidth: '420px',
                    margin: '1rem',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 60px rgba(212,175,55,0.06)',
                }}
            >
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.6rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaUtensils style={{ color: 'var(--gold)', fontSize: '1rem' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--cream)' }}>
                        Buggy <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Foods</em>
                    </span>
                </div>

                <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--cream)', fontSize: '1.6rem', marginBottom: '0.3rem', marginTop: '0.5rem' }}>
                    Admin Portal
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginBottom: '1.75rem' }}>
                    Sign in to manage your restaurant
                </p>

                {/* Hint box */}
                <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '10px', padding: '0.6rem 0.9rem', marginBottom: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Demo: <code style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--gold)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>admin</code> / <code style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--gold)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>admin123</code>
                </div>

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                    {/* Username */}
                    <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <FaUser style={{ fontSize: '0.7rem' }} /> Username
                        </label>
                        <input className="form-input" name="username" value={form.username} onChange={change} placeholder="admin" autoComplete="username" />
                        {errors.username && <span className="form-error">{errors.username}</span>}
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <FaLock style={{ fontSize: '0.7rem' }} /> Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="form-input"
                                name="password"
                                type={showPwd ? 'text' : 'password'}
                                value={form.password}
                                onChange={change}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                style={{ paddingRight: '3rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPwd(p => !p)}
                                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                {showPwd ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        {errors.password && <span className="form-error">{errors.password}</span>}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-gold"
                        style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.95rem', fontSize: '0.95rem' }}
                        disabled={loading}
                    >
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.25)', borderTopColor: 'rgba(0,0,0,0.7)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                Authenticating…
                            </span>
                        ) : (
                            <><FaSignInAlt /> Sign In</>
                        )}
                    </button>
                </form>
            </motion.div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
