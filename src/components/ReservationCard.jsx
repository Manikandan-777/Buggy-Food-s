import { FaUser, FaCalendarAlt, FaClock, FaUsers, FaEnvelope, FaPhone, FaCommentAlt } from 'react-icons/fa'
import { motion } from 'framer-motion'

/**
 * ReservationCard — displays a single booking as a styled card.
 * Props:
 *   booking   — booking object { id, name, email, phone, date, time, guests, requests, status }
 *   onConfirm — (id) => void  (optional)
 *   onCancel  — (id) => void  (optional)
 *   onDelete  — (id) => void  (optional)
 */
export default function ReservationCard({ booking, onConfirm, onCancel, onDelete }) {
    const statusClass = booking.status?.toLowerCase() ?? 'pending'

    return (
        <motion.div
            className="res-card"
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300 }}
        >
            {/* Header */}
            <div className="res-card__header">
                <div className="res-card__ref">#{booking.id?.slice(-6).toUpperCase()}</div>
                <span className={`badge badge-${statusClass}`}>{booking.status}</span>
            </div>

            {/* Guest info */}
            <div className="res-card__body">
                <div className="res-card__row">
                    <FaUser className="res-card__icon" />
                    <span className="res-card__value">{booking.name}</span>
                </div>
                <div className="res-card__row">
                    <FaEnvelope className="res-card__icon" />
                    <span className="res-card__value">{booking.email}</span>
                </div>
                <div className="res-card__row">
                    <FaPhone className="res-card__icon" />
                    <span className="res-card__value">{booking.phone}</span>
                </div>
                <div className="res-card__divider" />
                <div className="res-card__details">
                    <div className="res-card__detail">
                        <FaCalendarAlt className="res-card__icon" />
                        <div>
                            <div className="res-card__label">Date</div>
                            <div className="res-card__value">{booking.date}</div>
                        </div>
                    </div>
                    <div className="res-card__detail">
                        <FaClock className="res-card__icon" />
                        <div>
                            <div className="res-card__label">Time</div>
                            <div className="res-card__value">{booking.time}</div>
                        </div>
                    </div>
                    <div className="res-card__detail">
                        <FaUsers className="res-card__icon" />
                        <div>
                            <div className="res-card__label">Guests</div>
                            <div className="res-card__value">{booking.guests}</div>
                        </div>
                    </div>
                </div>
                {booking.requests && (
                    <div className="res-card__row res-card__note">
                        <FaCommentAlt className="res-card__icon" />
                        <span className="res-card__value">{booking.requests}</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            {(onConfirm || onCancel || onDelete) && (
                <div className="res-card__actions">
                    {onConfirm && booking.status !== 'Confirmed' && (
                        <button className="btn btn-sm" style={{ background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.3)', color: '#2ECC71' }} onClick={() => onConfirm(booking.id)}>
                            Confirm
                        </button>
                    )}
                    {onCancel && booking.status !== 'Cancelled' && (
                        <button className="btn btn-sm" style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: '#E74C3C' }} onClick={() => onCancel(booking.id)}>
                            Cancel
                        </button>
                    )}
                    {onDelete && (
                        <button className="btn btn-danger btn-sm" onClick={() => onDelete(booking.id)}>
                            Delete
                        </button>
                    )}
                </div>
            )}

            <style>{`
        .res-card {
          background: var(--dark-2);
          border: 1px solid rgba(212,168,67,0.14);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: var(--transition);
        }
        .res-card:hover {
          border-color: rgba(212,168,67,0.35);
          box-shadow: var(--shadow-md);
        }
        .res-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.9rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(212,168,67,0.04);
        }
        .res-card__ref {
          font-family: monospace;
          font-size: 0.8rem;
          color: var(--gold);
          letter-spacing: 0.05em;
        }
        .res-card__body {
          padding: 1.1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }
        .res-card__row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .res-card__note {
          background: rgba(212,168,67,0.05);
          border: 1px solid rgba(212,168,67,0.1);
          border-radius: var(--radius-sm);
          padding: 0.5rem 0.75rem;
          margin-top: 0.25rem;
        }
        .res-card__icon {
          color: var(--gold);
          font-size: 0.8rem;
          flex-shrink: 0;
          width: 14px;
        }
        .res-card__label {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .res-card__value {
          font-size: 0.88rem;
          color: var(--cream);
        }
        .res-card__divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
          margin: 0.2rem 0;
        }
        .res-card__details {
          display: flex;
          gap: 1.5rem;
        }
        .res-card__detail {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .res-card__actions {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          background: rgba(0,0,0,0.1);
          flex-wrap: wrap;
        }
      `}</style>
        </motion.div>
    )
}
