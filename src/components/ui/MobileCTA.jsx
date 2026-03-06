import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaCalendarAlt } from 'react-icons/fa'

export default function MobileCTA() {
    const { pathname } = useLocation()
    // Hide on reservation and admin pages
    if (pathname === '/reservation' || pathname.startsWith('/admin')) return null

    return (
        <motion.div
            className="mobile-cta"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5, type: 'spring', stiffness: 120 }}
        >
            <Link
                to="/reservation"
                className="btn btn-gold"
                style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}
            >
                <FaCalendarAlt /> Book a Table Now
            </Link>
        </motion.div>
    )
}
