import { Link } from 'react-router-dom'
import { FaUtensils, FaPhone, FaEnvelope, FaMapMarkerAlt, FaInstagram, FaFacebookF, FaTwitter } from 'react-icons/fa'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer style={{ background: 'var(--bg-2)', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
      {/* Gold glow line */}
      <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.45), transparent)' }} />

      <div style={{ padding: '4.5rem 0 2rem' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: '2.5rem' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--cream)', marginBottom: '1rem' }}>
              <FaUtensils style={{ color: 'var(--gold)' }} />
              <span>Buggy <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Foods</em></span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.8, maxWidth: 270, marginBottom: '1.5rem' }}>
              A celebration of fine cuisine, crafted with passion and served with elegance since 1998.
            </p>
            {/* Social */}
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              {[
                { icon: <FaInstagram />, label: 'Instagram' },
                { icon: <FaFacebookF />, label: 'Facebook' },
                { icon: <FaTwitter />, label: 'Twitter' },
              ].map(s => (
                <a key={s.label} href="#" aria-label={s.label} style={{
                  width: 38, height: 38, borderRadius: '50%',
                  border: '1px solid rgba(212,175,55,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)', fontSize: '0.85rem',
                  transition: 'all 0.28s',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--gold)'
                    e.currentTarget.style.color = 'var(--gold)'
                    e.currentTarget.style.background = 'rgba(212,175,55,0.08)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(212,175,55,0.22)'
                    e.currentTarget.style.color = 'var(--text-muted)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: 'var(--cream)', marginBottom: '1.25rem', letterSpacing: '0.02em' }}>Quick Links</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[['/', 'Home'], ['/menu', 'Our Menu'], ['/reservation', 'Book a Table'], ['/contact', 'Contact']].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} style={{ color: 'var(--text-muted)', fontSize: '0.88rem', transition: 'all 0.25s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.paddingLeft = '4px' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.paddingLeft = '0' }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: 'var(--cream)', marginBottom: '1.25rem' }}>Hours</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[['Mon – Thu', '12pm – 10pm'], ['Fri – Sat', '12pm – 11pm'], ['Sunday', '1pm – 9pm']].map(([day, time]) => (
                <li key={day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: '1rem' }}>
                  <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{day}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{time}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: 'var(--cream)', marginBottom: '1.25rem' }}>Find Us</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {[
                { icon: <FaMapMarkerAlt />, text: '42 Gourmet Lane, Food District, Chennai – 600001' },
                { icon: <FaPhone />, text: '+91 98765 43210' },
                { icon: <FaEnvelope />, text: 'hello@buggyfoods.in' },
              ].map((c, i) => (
                <li key={i} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--gold)', marginTop: 2, flexShrink: 0 }}>{c.icon}</span>
                  {c.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1.2rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '0.5rem' }}>
          <p>© {year} Buggy Foods. All rights reserved.</p>
          <p>Crafted with ❤️ for fine dining connoisseurs</p>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          footer .container { grid-template-columns: 1fr 1fr !important; }
          footer .container > div:first-child { grid-column: 1 / -1; }
        }
        @media (max-width: 640px) {
          footer .container { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  )
}
