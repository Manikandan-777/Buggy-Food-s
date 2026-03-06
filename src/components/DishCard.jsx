import { motion } from 'framer-motion'
import { FaLeaf, FaDrumstickBite, FaStar, FaFire } from 'react-icons/fa'

export default function DishCard({ item }) {
  return (
    <motion.div
      className="dish-card"
      whileHover={{ y: -8, transition: { type: 'spring', stiffness: 280, damping: 20 } }}
    >
      {/* Image */}
      <div className="dish-card__img-wrap">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          decoding="async"
        />
        {/* Badges */}
        <div className="dish-card__overlay">
          <span className={`badge ${item.isVeg ? 'badge-veg' : 'badge-nonveg'}`}>
            {item.isVeg ? <FaLeaf style={{ fontSize: '0.6rem' }} /> : <FaDrumstickBite style={{ fontSize: '0.6rem' }} />}
            {item.isVeg ? 'Veg' : 'Non-Veg'}
          </span>
          {item.featured && (
            <span className="badge badge-gold">
              <FaStar style={{ fontSize: '0.6rem' }} /> Chef's Pick
            </span>
          )}
        </div>
        {/* Price floating on image bottom-right */}
        <div style={{
          position: 'absolute',
          bottom: '0.85rem',
          right: '0.85rem',
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: '8px',
          padding: '0.25rem 0.7rem',
          fontFamily: 'var(--font-heading)',
          fontSize: '1.05rem',
          fontWeight: 700,
          color: 'var(--gold)',
          zIndex: 2,
        }}>
          ₹{item.price?.toLocaleString()}
        </div>
      </div>

      {/* Body */}
      <div className="dish-card__body">
        <div className="dish-card__category">{item.category}</div>
        <h3 className="dish-card__name">{item.name}</h3>
        <p className="dish-card__desc">{item.description}</p>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {item.spiceLevel && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <FaFire style={{ color: '#EF4444', fontSize: '0.65rem' }} />
                {item.spiceLevel}
              </span>
            )}
          </div>
          <button
            onClick={() => { }}
            style={{
              background: 'rgba(212,175,55,0.09)',
              border: '1px solid rgba(212,175,55,0.25)',
              borderRadius: '8px',
              color: 'var(--gold)',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-body)',
              padding: '0.38rem 0.85rem',
              cursor: 'pointer',
              transition: 'all 0.25s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(212,175,55,0.18)'
              e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(212,175,55,0.09)'
              e.currentTarget.style.borderColor = 'rgba(212,175,55,0.25)'
            }}
          >
            VIEW
          </button>
        </div>
      </div>
    </motion.div>
  )
}
