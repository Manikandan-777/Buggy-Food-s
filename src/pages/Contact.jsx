import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaPaperPlane } from 'react-icons/fa'
import toast from 'react-hot-toast'

const contactInfo = [
    { icon: <FaMapMarkerAlt />, title: 'Address', lines: ['42 Gourmet Lane, Food District', 'Chennai, Tamil Nadu – 600001'] },
    { icon: <FaPhone />, title: 'Phone', lines: ['+91 98765 43210', '+91 98765 43211'] },
    { icon: <FaEnvelope />, title: 'Email', lines: ['hello@buggyfoods.in', 'reservations@buggyfoods.in'] },
    { icon: <FaClock />, title: 'Hours', lines: ['Mon–Thu: 12pm – 10pm', 'Fri–Sat: 12pm – 11pm', 'Sun: 1pm – 9pm'] },
]

function validate(form) {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Valid email is required'
    if (!form.subject.trim()) e.subject = 'Subject is required'
    if (!form.message.trim() || form.message.trim().length < 10) e.message = 'Please enter a message (min. 10 characters)'
    return e
}

export default function Contact() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const errs = validate(form)
        setErrors(errs)
        if (Object.keys(errs).length) return
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            toast.success('Message sent! We\'ll get back to you soon.')
            setForm({ name: '', email: '', subject: '', message: '' })
        }, 1200)
    }

    return (
        <main className="page-content" style={{ paddingTop: '80px' }}>
            <div className="page-hero">
                <div className="page-hero-content">
                    <span className="section-subtitle">Get in Touch</span>
                    <h1 className="section-title">Contact <span>Us</span></h1>
                    <div className="ornament"><div className="ornament-diamond" /></div>
                    <p className="section-desc">We'd love to hear from you. Reach out for enquiries, feedback, or special event bookings.</p>
                </div>
            </div>

            <section className="section">
                <div className="container">
                    {/* Contact Info Cards */}
                    <div className="grid-4" style={{ marginBottom: '3.5rem' }}>
                        {contactInfo.map((info, i) => (
                            <motion.div
                                key={info.title}
                                className="contact-info-card"
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                            >
                                <div className="contact-info-card__icon">{info.icon}</div>
                                <h4>{info.title}</h4>
                                {info.lines.map(l => <p key={l}>{l}</p>)}
                            </motion.div>
                        ))}
                    </div>

                    {/* Map + Form */}
                    <div className="contact-grid">
                        {/* Map */}
                        <div className="contact-map">
                            <iframe
                                title="Restaurant Location"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.5!2d80.2707!3d13.0827!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDA0JzU3LjciTiA4MMKwMTYnMTQuNSJF!5e0!3m2!1sen!2sin!4v1"
                                width="100%"
                                height="100%"
                                style={{ border: 0, borderRadius: 'var(--radius-lg)', filter: 'invert(90%) hue-rotate(180deg)' }}
                                allowFullScreen=""
                                loading="lazy"
                            />
                        </div>

                        {/* Enquiry Form */}
                        <motion.form
                            onSubmit={handleSubmit}
                            className="enquiry-form"
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--cream)', marginBottom: '1.5rem' }}>
                                Send an Enquiry
                            </h3>

                            <div className="form-group">
                                <label className="form-label">Your Name</label>
                                <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Full name" />
                                {errors.name && <span className="form-error">{errors.name}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" />
                                {errors.email && <span className="form-error">{errors.email}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Subject</label>
                                <input className="form-input" name="subject" value={form.subject} onChange={handleChange} placeholder="e.g. Private Event Booking" />
                                {errors.subject && <span className="form-error">{errors.subject}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Message</label>
                                <textarea className="form-textarea" name="message" value={form.message} onChange={handleChange} placeholder="Tell us how we can help..." style={{ minHeight: '130px' }} />
                                {errors.message && <span className="form-error">{errors.message}</span>}
                            </div>

                            <button type="submit" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                                {loading ? 'Sending...' : <><FaPaperPlane /> Send Message</>}
                            </button>
                        </motion.form>
                    </div>
                </div>
            </section>

            <style>{`
        .contact-info-card {
          background: var(--bg-2);
          border: 1px solid rgba(212,175,55,0.12);
          border-radius: 20px;
          padding: 1.75rem 1.5rem;
          text-align: center;
          transition: var(--t);
        }
        .contact-info-card:hover {
          border-color: rgba(212,175,55,0.38);
          transform: translateY(-5px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.4), 0 0 20px rgba(212,175,55,0.08);
        }
        .contact-info-card__icon {
          width: 54px; height: 54px;
          background: rgba(212,175,55,0.1);
          border: 1px solid rgba(212,175,55,0.28);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--gold); font-size: 1.2rem;
          margin: 0 auto 1rem;
          box-shadow: 0 0 16px rgba(212,175,55,0.12);
        }
        .contact-info-card h4 { font-family: var(--font-heading); color: var(--cream); font-size: 1rem; margin-bottom: 0.5rem; }
        .contact-info-card p { color: var(--text-muted); font-size: 0.85rem; line-height: 1.65; }
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: start;
        }
        .contact-map {
          height: 450px;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(212,175,55,0.15);
        }
        .enquiry-form {
          background: var(--bg-2);
          border: 1px solid rgba(212,175,55,0.15);
          border-radius: 20px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr; }
          .contact-map { height: 260px; }
        }
      `}</style>
        </main>
    )
}
