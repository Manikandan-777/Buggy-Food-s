import { useState, useRef, useEffect } from 'react'
import { FaTimes, FaPaperPlane, FaUtensils, FaCheckCircle } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import toast from 'react-hot-toast'

/* ── Slot labels for booking-mode progress chips ─────────────────── */
const BOOKING_SLOTS = {
    guests: '👥 Guests',
    date: '📅 Date',
    time: '🕐 Time',
    name: '👤 Name',
    phone: '📱 Phone',
    email: '📧 Email',
}

/* ── Quick suggestions ───────────────────────────────────────────── */
const QUICK_PICKS = [
    '🍽️ What\'s on the menu?',
    '🌟 What are your best dishes?',
    '⏰ What are your opening hours?',
    '📅 Book a table',
]

const WELCOME = {
    role: 'bot',
    text: `🍴 Welcome to **Buggy Foods**! I'm your AI dining assistant.\n\nAsk me anything about our menu, timings, location, or book a table!\n\nTry one of the suggestions below 👇`,
}

export default function ChatBot() {
    const [open, setOpen] = useState(false)
    const [msgs, setMsgs] = useState([WELCOME])
    const [input, setInput] = useState('')
    const [session, setSession] = useState({})
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)
    const bottomRef = useRef(null)

    const isBookingMode = session._mode === 'booking'

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [msgs, open])

    const addMsg = (role, text) => setMsgs(m => [...m, { role, text }])

    const reset = () => { setMsgs([WELCOME]); setSession({}); setInput(''); setDone(false) }

    const send = async (overrideText) => {
        const text = (overrideText ?? input).trim()
        if (!text || loading) return
        setInput('')
        addMsg('user', text)
        setLoading(true)

        try {
            const { data } = await api.post('/ml/chat/message', { message: text, session })
            if (data.session !== undefined) setSession(data.session)

            if (data.done) {
                setDone(true)
                addMsg('bot', data.reply)
                toast.success('🎉 Table booked!')
                setTimeout(() => { setOpen(false); reset() }, 7000)
            } else {
                addMsg('bot', data.reply || "I didn't quite get that. Try asking about our menu, hours, or booking!")
            }
        } catch (err) {
            const msg = err.response?.data?.reply || err.response?.data?.message || 'Connection error. Is the server running?'
            addMsg('bot', `⚠️ ${msg}`)
        } finally {
            setLoading(false)
        }
    }

    const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

    // Booking progress
    const filledSlots = isBookingMode ? Object.keys(BOOKING_SLOTS).filter(k => session[k]).length : 0
    const totalSlots = Object.keys(BOOKING_SLOTS).length
    const progress = isBookingMode ? Math.round((filledSlots / totalSlots) * 100) : 0

    /* ── Format bot text: bold **text**, newlines ──────────────────── */
    const formatText = (text) => {
        return text.split('\n').map((line, i) => {
            const parts = line.split(/\*\*(.*?)\*\*/g)
            return (
                <span key={i}>
                    {parts.map((part, j) =>
                        j % 2 === 1
                            ? <strong key={j} style={{ color: 'var(--gold)', fontWeight: 600 }}>{part}</strong>
                            : part
                    )}
                    {i < text.split('\n').length - 1 && <br />}
                </span>
            )
        })
    }

    return (
        <>
            {/* ── Floating restaurant button ───────────────────────────── */}
            <motion.button
                onClick={() => setOpen(o => !o)}
                whileHover={{ scale: 1.1, rotate: open ? 0 : 10 }}
                whileTap={{ scale: 0.93 }}
                aria-label="Restaurant AI Assistant"
                style={{
                    position: 'fixed', bottom: '5.5rem', right: '1.5rem', zIndex: 950,
                    width: 56, height: 56, borderRadius: '50%',
                    background: done
                        ? 'linear-gradient(135deg, #2ECC71, #27AE60)'
                        : open
                            ? 'linear-gradient(135deg, #4a0e21, var(--burgundy))'
                            : 'linear-gradient(135deg, var(--burgundy), #9B2335, var(--gold-d))',
                    border: '2px solid rgba(212,175,55,0.35)',
                    color: '#fff', fontSize: '1.25rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 0 rgba(212,175,55,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.4s',
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.span key={done ? 'check' : open ? 'close' : 'fork'}
                        initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                        exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {done ? <FaCheckCircle /> : open ? <FaTimes /> : <FaUtensils />}
                    </motion.span>
                </AnimatePresence>
            </motion.button>

            {/* ── Chat window ─────────────────────────────────────────── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.93 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.93 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                        style={{
                            position: 'fixed', bottom: '10.5rem', right: '1.5rem', zIndex: 940,
                            width: 350, maxHeight: 560,
                            background: 'linear-gradient(160deg, #1a0a0f 0%, var(--bg-2) 100%)',
                            border: '1px solid rgba(212,175,55,0.25)',
                            borderRadius: '22px',
                            boxShadow: '0 28px 90px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.05)',
                            display: 'flex', flexDirection: 'column', overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '1rem 1.25rem 0.85rem',
                            background: 'linear-gradient(135deg, rgba(123,30,58,0.6), rgba(212,175,55,0.06))',
                            borderBottom: '1px solid rgba(212,175,55,0.14)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FaUtensils style={{ color: 'var(--gold)', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--cream)', fontSize: '0.97rem', lineHeight: 1 }}>
                                        Buggy Foods AI
                                    </div>
                                    <div style={{ fontSize: '0.67rem', color: '#2ECC71', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2ECC71', display: 'inline-block' }} />
                                        {isBookingMode ? 'Booking Mode' : 'Online — Ask me anything!'}
                                    </div>
                                </div>
                            </div>
                            <button onClick={reset} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'var(--font-body)', textDecoration: 'underline' }}>
                                New Chat
                            </button>
                        </div>

                        {/* Booking progress bar (only in booking mode) */}
                        {isBookingMode && (
                            <div style={{ padding: '0.55rem 1rem 0.3rem', background: 'rgba(212,175,55,0.03)', borderBottom: '1px solid rgba(212,175,55,0.07)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                    <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Table booking progress</span>
                                    <span style={{ fontSize: '0.67rem', color: 'var(--gold)' }}>{filledSlots}/{totalSlots}</span>
                                </div>
                                <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 100, marginBottom: '0.45rem' }}>
                                    <motion.div
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.4 }}
                                        style={{ height: '100%', background: 'linear-gradient(to right, var(--burgundy), var(--gold))', borderRadius: 100 }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', paddingBottom: '0.1rem' }}>
                                    {Object.entries(BOOKING_SLOTS).map(([k, label]) => (
                                        <span key={k} style={{
                                            fontSize: '0.63rem', padding: '0.1rem 0.45rem', borderRadius: '100px',
                                            background: session[k] ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                                            color: session[k] ? 'var(--gold)' : 'rgba(255,255,255,0.3)',
                                            border: `1px solid ${session[k] ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.07)'}`,
                                        }}>
                                            {label} {session[k] ? '✓' : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {msgs.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{
                                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                        background: m.role === 'user'
                                            ? 'linear-gradient(135deg, rgba(123,30,58,0.5), rgba(155,35,53,0.3))'
                                            : 'rgba(255,255,255,0.055)',
                                        border: `1px solid ${m.role === 'user' ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.07)'}`,
                                        borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                        padding: '0.6rem 0.9rem',
                                        maxWidth: '90%',
                                        fontSize: '0.83rem',
                                        color: 'var(--text)',
                                        lineHeight: 1.7,
                                    }}
                                >
                                    {m.role === 'bot' ? formatText(m.text) : m.text}
                                </motion.div>
                            ))}

                            {/* Typing indicator */}
                            {loading && (
                                <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.055)', borderRadius: '18px 18px 18px 4px', padding: '0.65rem 1rem', display: 'flex', gap: 5 }}>
                                    {[0, 1, 2].map(i => (
                                        <motion.div key={i} animate={{ y: [0, -6, 0] }} transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.14 }}
                                            style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
                                    ))}
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Quick picks — shown only at conversational start */}
                        {msgs.length <= 1 && !loading && !isBookingMode && (
                            <div style={{ padding: '0.35rem 0.9rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                                {QUICK_PICKS.map(q => (
                                    <button key={q} onClick={() => send(q.replace(/^[^ ]+ /, ''))}
                                        style={{
                                            background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)',
                                            borderRadius: '10px', padding: '0.35rem 0.6rem',
                                            color: 'var(--cream)', fontSize: '0.7rem', cursor: 'pointer',
                                            fontFamily: 'var(--font-body)', textAlign: 'left', lineHeight: 1.4,
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => e.target.style.background = 'rgba(212,175,55,0.13)'}
                                        onMouseLeave={e => e.target.style.background = 'rgba(212,175,55,0.06)'}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div style={{ padding: '0.65rem 0.75rem', display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(212,175,55,0.1)', background: 'rgba(0,0,0,0.15)' }}>
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKey}
                                placeholder={
                                    done ? 'Booking confirmed! ✅' :
                                        isBookingMode ? 'Enter your booking details…' :
                                            'Ask about menu, hours, booking…'
                                }
                                disabled={done || loading}
                                style={{
                                    flex: 1, background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(212,175,55,0.18)', borderRadius: '12px',
                                    padding: '0.62rem 0.9rem', color: 'var(--cream)', fontSize: '0.84rem',
                                    outline: 'none', fontFamily: 'var(--font-body)',
                                    opacity: done ? 0.5 : 1, transition: 'border-color 0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = 'rgba(212,175,55,0.45)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(212,175,55,0.18)'}
                            />
                            <motion.button
                                onClick={() => send()}
                                disabled={loading || !input.trim() || done}
                                whileTap={{ scale: 0.9 }}
                                style={{
                                    background: loading || !input.trim() || done ? 'rgba(212,175,55,0.25)' : 'var(--gold)',
                                    border: 'none', borderRadius: '12px', padding: '0.62rem 0.9rem',
                                    color: '#0D0604', cursor: loading || done ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem', transition: 'all 0.25s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <FaPaperPlane />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
