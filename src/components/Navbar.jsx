import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaBars, FaTimes, FaUtensils } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/reservation', label: 'Reservation' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [location])

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 900,
          padding: scrolled ? '0.7rem 0' : '1.3rem 0',
          background: scrolled
            ? 'rgba(18,18,18,0.95)'
            : 'linear-gradient(to bottom, rgba(18,18,18,0.85), transparent)',
          backdropFilter: scrolled ? 'blur(20px)' : 'blur(0px)',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'blur(0px)',
          borderBottom: scrolled ? '1px solid rgba(212,175,55,0.12)' : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.5)' : 'none',
          transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontFamily: 'var(--font-heading)', fontSize: '1.45rem', color: 'var(--cream)', fontWeight: 700, textDecoration: 'none' }}>
            <FaUtensils style={{ color: 'var(--gold)', fontSize: '1.1rem' }} />
            <span>Buggy <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Foods</em></span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="desktop-nav">
            {NAV_LINKS.map(link => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    padding: '0.5rem 1rem',
                    color: isActive ? 'var(--cream)' : 'rgba(232,224,208,0.65)',
                    fontSize: '0.88rem',
                    fontWeight: 500,
                    fontFamily: 'var(--font-body)',
                    borderRadius: '8px',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                    letterSpacing: '0.01em',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--cream)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(232,224,208,0.65)' }}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      style={{
                        position: 'absolute',
                        bottom: '2px', left: '50%',
                        transform: 'translateX(-50%)',
                        width: '18px', height: '2px',
                        background: 'var(--gold)',
                        borderRadius: '1px',
                        display: 'block',
                        boxShadow: '0 0 8px rgba(212,175,55,0.6)',
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
            <Link
              to="/login"
              style={{ marginLeft: '0.5rem', padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: 600, color: 'rgba(232,224,208,0.65)', fontFamily: 'var(--font-body)', textDecoration: 'none', transition: 'color 0.25s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--cream)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(232,224,208,0.65)'}
            >
              Sign In
            </Link>
            <Link to="/reservation" className="btn btn-gold btn-sm" style={{ marginLeft: '0.5rem' }}>
              Book a Table
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
            style={{ display: 'none', background: 'none', border: '1px solid rgba(212,175,55,0.28)', color: 'var(--cream)', padding: '0.45rem', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', transition: 'all 0.25s', alignItems: 'center', justifyContent: 'center' }}
            className="mobile-toggle"
          >
            {open ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28 }}
              style={{ overflow: 'hidden', borderTop: '1px solid rgba(212,175,55,0.1)', background: 'rgba(18,18,18,0.98)' }}
            >
              <div style={{ padding: '1rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {NAV_LINKS.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    style={{
                      padding: '0.78rem 1rem',
                      color: location.pathname === link.to ? 'var(--gold)' : 'var(--text-muted)',
                      fontSize: '0.95rem',
                      fontFamily: 'var(--font-body)',
                      borderRadius: '10px',
                      background: location.pathname === link.to ? 'rgba(212,175,55,0.07)' : 'transparent',
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link to="/login" style={{ padding: '0.78rem 1rem', color: 'var(--text-muted)', fontSize: '0.95rem', fontFamily: 'var(--font-body)', borderRadius: '10px', textDecoration: 'none', fontWeight: 500 }}>
                  Sign In
                </Link>
                <Link to="/reservation" className="btn btn-gold" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}>
                  Book a Table
                </Link>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}</style>
    </>
  )
}
