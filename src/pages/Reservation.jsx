import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaCalendarAlt, FaUser, FaPhone, FaEnvelope, FaClock, FaUsers, FaCheckCircle } from 'react-icons/fa'
import { useBooking } from '../context/BookingContext'
import toast from 'react-hot-toast'

const TIME_SLOTS = ['12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM']

const emptyForm = { name: '', email: '', phone: '', date: '', time: '', guests: '2', requests: '' }

function validate(form) {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Valid email is required'
    if (!form.phone.trim() || !/^[0-9]{10}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Valid 10-digit phone number required'
    if (!form.date) e.date = 'Please select a date'
    else {
        const selected = new Date(form.date)
        const today = new Date(); today.setHours(0, 0, 0, 0)
        if (selected < today) e.date = 'Date cannot be in the past'
    }
    if (!form.time) e.time = 'Please select a time slot'
    if (!form.guests || form.guests < 1 || form.guests > 20) e.guests = 'Guests must be between 1 and 20'
    return e
}

export default function Reservation() {
    const { addBooking } = useBooking()
    const [form, setForm] = useState(emptyForm)
    const [errors, setErrors] = useState({})
    const [submitted, setSubmitted] = useState(false)
    const [bookingRef, setBookingRef] = useState(null)

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const errs = validate(form)
        setErrors(errs)
        if (Object.keys(errs).length) { toast.error('Please fix the errors before submitting.'); return }
        try {
            const booking = await addBooking({ ...form, guests: Number(form.guests) })
            setBookingRef(booking._id)
            setSubmitted(true)
            toast.success('Reservation confirmed!')
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to submit. Is the server running?'
            toast.error(msg)
        }
    }

    const today = new Date().toISOString().split('T')[0]

    if (submitted) {
        return (
            <main className="page-content" style={{ paddingTop: '80px' }}>
                <div className="page-hero">
                    <div className="page-hero-content">
                        <h1 className="section-title">Book a <span>Table</span></h1>
                    </div>
                </div>
                <section className="section">
                    <div className="container" style={{ maxWidth: '540px' }}>
                        <motion.div
                            className="success-card"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            <FaCheckCircle className="success-icon" />
                            <h2>Reservation Confirmed!</h2>
                            <p>Thank you, <strong>{form.name}</strong>! Your table for <strong>{form.guests}</strong> guest(s) on <strong>{form.date}</strong> at <strong>{form.time}</strong> has been reserved.</p>
                            <div className="success-ref">Booking Reference: <strong>#{bookingRef?.toString().slice(-6).toUpperCase()}</strong></div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>A confirmation will be sent to <em>{form.email}</em></p>
                            <button className="btn btn-gold" style={{ marginTop: '1.5rem' }} onClick={() => { setSubmitted(false); setForm(emptyForm) }}>
                                Book Another Table
                            </button>
                        </motion.div>
                    </div>
                </section>
                <style>{`
          .success-card {
            background: var(--dark-2);
            border: 1px solid rgba(46,204,113,0.3);
            border-radius: var(--radius-lg);
            padding: 3rem 2.5rem;
            text-align: center;
          }
          .success-icon { font-size: 4rem; color: #2ECC71; margin-bottom: 1.2rem; }
          .success-card h2 { font-family: var(--font-heading); color: var(--cream); margin-bottom: 1rem; }
          .success-card p { color: var(--text-muted); line-height: 1.7; margin-bottom: 0.75rem; }
          .success-card strong { color: var(--cream); }
          .success-ref { background: rgba(212,168,67,0.08); border: 1px solid rgba(212,168,67,0.2); border-radius: var(--radius-md); padding: 0.75rem 1.5rem; margin: 1rem 0; color: var(--gold); font-size: 1.05rem; }
        `}</style>
            </main>
        )
    }

    return (
        <main className="page-content" style={{ paddingTop: '80px' }}>
            <div className="page-hero">
                <div className="page-hero-content">
                    <span className="section-subtitle">Reserve Your Seat</span>
                    <h1 className="section-title">Book a <span>Table</span></h1>
                    <div className="ornament"><div className="ornament-diamond" /></div>
                    <p className="section-desc">Fill in your details below and we'll confirm your reservation shortly.</p>
                </div>
            </div>

            <section className="section">
                <div className="container" style={{ maxWidth: '700px' }}>
                    <motion.form
                        onSubmit={handleSubmit}
                        className="booking-form"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="booking-form__header">
                            <FaCalendarAlt />
                            <span>Reservation Details</span>
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label"><FaUser style={{ marginRight: 4 }} />Full Name</label>
                                <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" />
                                {errors.name && <span className="form-error">{errors.name}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label"><FaPhone style={{ marginRight: 4 }} />Phone</label>
                                <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit mobile number" />
                                {errors.phone && <span className="form-error">{errors.phone}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label"><FaEnvelope style={{ marginRight: 4 }} />Email Address</label>
                            <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" />
                            {errors.email && <span className="form-error">{errors.email}</span>}
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label"><FaCalendarAlt style={{ marginRight: 4 }} />Date</label>
                                <input className="form-input" name="date" type="date" value={form.date} onChange={handleChange} min={today} />
                                {errors.date && <span className="form-error">{errors.date}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label"><FaUsers style={{ marginRight: 4 }} />Number of Guests</label>
                                <input className="form-input" name="guests" type="number" min="1" max="20" value={form.guests} onChange={handleChange} />
                                {errors.guests && <span className="form-error">{errors.guests}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label"><FaClock style={{ marginRight: 4 }} />Preferred Time Slot</label>
                            <div className="time-slots">
                                {TIME_SLOTS.map(slot => (
                                    <button
                                        key={slot}
                                        type="button"
                                        className={`time-slot${form.time === slot ? ' active' : ''}`}
                                        onClick={() => { setForm(p => ({ ...p, time: slot })); if (errors.time) setErrors(p => ({ ...p, time: '' })) }}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                            {errors.time && <span className="form-error">{errors.time}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Special Requests (Optional)</label>
                            <textarea className="form-textarea" name="requests" value={form.requests} onChange={handleChange} placeholder="Allergies, anniversary setup, dietary requirements..." />
                        </div>

                        <button type="submit" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
                            <FaCalendarAlt /> Confirm Reservation
                        </button>
                    </motion.form>
                </div>
            </section>

            <style>{`
        .booking-form {
          background: var(--bg-2);
          border: 1px solid rgba(212,175,55,0.15);
          border-radius: 20px;
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
          box-shadow: 0 24px 80px rgba(0,0,0,0.4);
        }
        .booking-form__header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-family: var(--font-heading);
          font-size: 1.3rem;
          color: var(--cream);
          padding-bottom: 1.2rem;
          border-bottom: 1px solid rgba(212,175,55,0.1);
        }
        .booking-form__header svg { color: var(--gold); }
        .time-slots { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .time-slot {
          padding: 0.45rem 1rem; border-radius: 100px;
          border: 1.5px solid rgba(212,175,55,0.18); background: transparent;
          color: var(--text-muted); font-size: 0.82rem; cursor: pointer;
          transition: var(--t); font-family: var(--font-body);
        }
        .time-slot:hover { border-color: var(--gold); color: var(--gold); background: rgba(212,175,55,0.06); }
        .time-slot.active { background: var(--gold); color: #0D0604; border-color: var(--gold); font-weight: 700; box-shadow: 0 0 16px rgba(212,175,55,0.3); }
        @media (max-width: 640px) { .booking-form { padding: 1.5rem; } }
      `}</style>
        </main>
    )
}
