import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import {
    FaUtensils, FaCalendarAlt, FaStar, FaLeaf, FaAward,
    FaArrowRight, FaPlay, FaTimes, FaMapMarkerAlt, FaClock,
    FaPhone, FaShieldAlt, FaFireAlt, FaChevronRight,
} from 'react-icons/fa'
import { useMenu } from '../context/MenuContext'

/* ── Animation variants ── */
const fadeUp = { hidden: { opacity: 0, y: 50 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } }
const fadeLeft = { hidden: { opacity: 0, x: -60 }, show: { opacity: 1, x: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } } }
const fadeRight = { hidden: { opacity: 0, x: 60 }, show: { opacity: 1, x: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } }

function Reveal({ children, variants = fadeUp, style = {} }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-80px 0px' })
    return (
        <motion.div ref={ref} variants={variants} initial="hidden" animate={inView ? 'show' : 'hidden'} style={style}>
            {children}
        </motion.div>
    )
}

function StaggerReveal({ children, style = {} }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-60px 0px' })
    return (
        <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'} style={style}>
            {children}
        </motion.div>
    )
}

/* ── Data ── */
const HERO_BG = 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1800&q=90&auto=format'
const CHEF_IMG = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=900&q=85&auto=format'
const OFFER_BG = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=85&auto=format'
const WHY_IMG = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=85&auto=format'

const GALLERY_IMGS = [
    'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=700&q=80',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=500&q=80',
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=500&q=80',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80',
]

const DISH_IMGS = [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
]

const FEATURES = [
    { icon: <FaLeaf />, title: 'Farm Fresh', desc: 'Only the finest seasonal ingredients sourced directly from local organic farms.' },
    { icon: <FaAward />, title: 'Award Winning', desc: 'Recognised by top food critics and acclaimed by guests across the country.' },
    { icon: <FaClock />, title: 'Open Daily', desc: 'Mon–Sun, 12:00 PM – 10:00 PM. Always ready to serve you perfectly.' },
    { icon: <FaShieldAlt />, title: 'Safe & Hygienic', desc: 'Gold-standard kitchen hygiene with certified food safety protocols.' },
]

const STATS = [
    { value: '28+', label: 'Years of Excellence' },
    { value: '100+', label: 'Curated Dishes' },
    { value: '4.9★', label: 'Average Rating' },
    { value: '50K+', label: 'Happy Guests' },
]

const TESTIMONIALS = [
    { name: 'Priya Sharma', role: 'Food Critic, TasteIndia', text: 'Buggy Foods redefined fine dining for me. Every dish tells a story, every bite is a memory.', stars: 5, av: 'P' },
    { name: 'Arjun Mehta', role: 'CEO, TechVentures', text: 'An unforgettable experience — the ambience and food are genuinely world-class. Our go-to for every occasion.', stars: 5, av: 'A' },
    { name: 'Lisa Chen', role: 'Travel Blogger', text: 'The best biriyani I have ever had, period. And I have eaten across 30 countries. Will absolutely be back!', stars: 5, av: 'L' },
]

/* ── Styles ── */
const S = {
    section: { padding: '100px 0', position: 'relative' },
    label: { fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12, display: 'block', fontFamily: 'var(--font-body)', fontWeight: 600 },
    heading: { fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.2rem,4.5vw,3.5rem)', color: 'var(--cream)', lineHeight: 1.1, fontWeight: 700, marginBottom: 18 },
    sub: { color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.75, maxWidth: 540 },
    glass: { background: 'var(--glass-bg)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' },
    goldGlass: { background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', backdropFilter: 'blur(16px)' },
}

export default function Home() {
    const { menuItems } = useMenu()
    const featured = menuItems.filter(i => i.featured).slice(0, 4)
    const displayDishes = featured.length >= 3 ? featured : [
        { _id: '1', name: 'Wagyu Beef Tenderloin', category: 'Mains', price: 2800, isVeg: false, description: '28-day dry-aged with truffle jus, roasted bone marrow and seasonal greens.' },
        { _id: '2', name: 'Butter Poached Lobster', category: 'Seafood', price: 3400, isVeg: false, description: 'Maine lobster tail, saffron beurre blanc, crispy capers, micro herbs.' },
        { _id: '3', name: 'Black Truffle Tagliatelle', category: 'Pasta', price: 1600, isVeg: true, description: 'Hand-rolled fresh pasta, 48-hour sauce, shaved black truffle, aged parmesan.' },
        { _id: '4', name: 'Gulab Jamun Fondant', category: 'Desserts', price: 680, isVeg: true, description: 'Rose-water glaze, cardamom cream, saffron gelato, edible gold leaf.' },
    ]

    const [lightbox, setLightbox] = useState(null)
    const [hovered, setHovered] = useState(null)

    return (
        <main style={{ background: 'var(--bg)', overflowX: 'hidden' }}>
            <Helmet>
                <title>Buggy Foods | Premium Fine Dining Restaurant</title>
                <meta name="description" content="Experience luxury dining at Buggy Foods — 100+ exquisite dishes, award-winning chefs, and unforgettable ambiance in Chennai. Book your table today." />
            </Helmet>

            {/* ═══════════════════════════ HERO ═══════════════════════════ */}
            <section style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', padding: '0 6%', paddingTop: 90, gap: 60, position: 'relative', overflow: 'hidden' }}>
                {/* BG glow */}
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 70% at 70% 50%, rgba(212,175,55,0.07), transparent 65%)' }} />

                {/* Left */}
                <motion.div initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} style={{ position: 'relative', zIndex: 2 }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 10, ...S.goldGlass, borderRadius: 100, padding: '7px 20px', fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 32 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 10px var(--gold)', display: 'inline-block' }} />
                        Est. 1998 · Chennai, India
                    </motion.div>

                    <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
                        style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(3rem,5.5vw,5.2rem)', lineHeight: 1.06, fontWeight: 700, color: 'var(--cream)', marginBottom: 24 }}>
                        Experience<br />the <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Taste</em> of<br />Excellence
                    </motion.h1>

                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
                        style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.75, maxWidth: 460, marginBottom: 42 }}>
                        Where every dish is a masterpiece. Indulge in an unforgettable culinary journey crafted by award-winning chefs in the heart of Chennai.
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }}
                        style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <Link to="/reservation" className="btn btn-gold" style={{ padding: '14px 32px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                            <FaCalendarAlt /> Reserve a Table
                        </Link>
                        <Link to="/menu" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '14px 32px', borderRadius: 100, border: '1.5px solid rgba(212,175,55,0.4)', color: 'var(--gold)', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.3s', fontFamily: 'var(--font-body)', textDecoration: 'none' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; e.currentTarget.style.borderColor = 'var(--gold)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)' }}>
                            <FaUtensils /> View Menu
                        </Link>
                    </motion.div>

                    {/* Micro stats */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }}
                        style={{ display: 'flex', gap: 36, marginTop: 52, paddingTop: 36, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        {[['4.9★', 'Rating'], ['50K+', 'Guests'], ['100+', 'Dishes']].map(([v, l]) => (
                            <div key={l}>
                                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.65rem', color: 'var(--gold)', fontWeight: 700, lineHeight: 1 }}>{v}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.04em' }}>{l}</div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Right — Hero image */}
                <motion.div initial={{ opacity: 0, scale: 0.92, x: 60 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    style={{ position: 'relative', zIndex: 2 }} className="hero-img-col">
                    <div style={{ borderRadius: 32, overflow: 'hidden', height: 580, boxShadow: '0 40px 120px rgba(0,0,0,0.7)' }}>
                        <img src={HERO_BG} alt="Gourmet Dish" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    {/* Floating badge */}
                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ position: 'absolute', bottom: 36, left: -32, ...S.glass, border: '1px solid rgba(212,175,55,0.2)', borderRadius: 20, padding: '18px 22px', display: 'flex', gap: 14, alignItems: 'center', zIndex: 3 }}>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', color: 'var(--gold)', fontWeight: 700, lineHeight: 1 }}>4.9</div>
                        <div><div style={{ color: 'var(--cream)', fontSize: '0.85rem', fontWeight: 600 }}>⭐ Rated</div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>50K+ Reviews</div></div>
                    </motion.div>
                    {/* Floating glow blobs */}
                    <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 6, repeat: Infinity }}
                        style={{ position: 'absolute', top: '-5%', right: '-5%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.18), transparent 70%)', pointerEvents: 'none' }} />
                </motion.div>

                {/* Floating ingredients decorations */}
                {['🌿', '🍋', '✨'].map((e, i) => (
                    <motion.div key={i} animate={{ y: [0, -16, 0], rotate: [0, 10, 0] }} transition={{ duration: 4 + i * 1.5, repeat: Infinity, delay: i * 1.2 }}
                        style={{ position: 'absolute', fontSize: i === 2 ? '1.2rem' : '1.6rem', opacity: 0.5, top: i === 0 ? '15%' : i === 1 ? '70%' : '30%', left: i === 0 ? '48%' : i === 1 ? '44%' : '90%', pointerEvents: 'none', zIndex: 1 }}>
                        {e}
                    </motion.div>
                ))}
            </section>

            {/* ═══════════════════════════ STATS BAR ═══════════════════════════ */}
            <div style={{ background: 'var(--bg-2)', borderTop: '1px solid rgba(212,175,55,0.1)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
                <div className="container">
                    <StaggerReveal style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '36px 0' }}>
                        {STATS.map((s, i) => (
                            <motion.div key={i} variants={fadeUp} style={{ textAlign: 'center', padding: '12px 20px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', color: 'var(--gold)', fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6, letterSpacing: '0.05em' }}>{s.label}</div>
                            </motion.div>
                        ))}
                    </StaggerReveal>
                </div>
            </div>

            {/* ═══════════════════════════ FEATURED DISHES ═══════════════════════════ */}
            <section style={{ ...S.section, background: 'var(--bg-2)' }}>
                <div className="container">
                    <Reveal style={{ textAlign: 'center', marginBottom: 64 }}>
                        <span style={S.label}>Our Signature</span>
                        <h2 style={S.heading}>Featured <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Dishes</em></h2>
                        <p style={{ ...S.sub, margin: '0 auto' }}>Handcrafted with the finest seasonal ingredients by our culinary artists.</p>
                    </Reveal>
                    <StaggerReveal style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 24 }}>
                        {displayDishes.map((dish, i) => (
                            <motion.div key={dish._id} variants={fadeUp}
                                style={{ background: 'var(--glass-bg)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)' }}
                                whileHover={{ y: -10, borderColor: 'rgba(212,175,55,0.35)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
                                <div style={{ height: 220, overflow: 'hidden', position: 'relative' }}>
                                    <motion.img src={DISH_IMGS[i % 4]} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        whileHover={{ scale: 1.1 }} transition={{ duration: 0.6 }} />
                                    <div style={{ position: 'absolute', top: 14, right: 14, background: dish.isVeg ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', border: `1px solid ${dish.isVeg ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`, borderRadius: 50, padding: '4px 12px', fontSize: '0.7rem', color: dish.isVeg ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                                        {dish.isVeg ? '🌿 Veg' : '🍖 Non-veg'}
                                    </div>
                                </div>
                                <div style={{ padding: '22px 22px 24px' }}>
                                    <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8, fontFamily: 'var(--font-body)' }}>{dish.category}</div>
                                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, color: 'var(--cream)', marginBottom: 8 }}>{dish.name}</div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 18, minHeight: 52 }}>{dish.description}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--gold)', fontWeight: 700 }}>₹{dish.price?.toLocaleString()}</span>
                                        <Link to="/menu" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--gold)', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
                                            Order <FaArrowRight style={{ fontSize: '0.7rem' }} />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </StaggerReveal>
                    <Reveal style={{ textAlign: 'center', marginTop: 48 }}>
                        <Link to="/menu" className="btn btn-gold" style={{ padding: '14px 40px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                            View Full Menu <FaChevronRight />
                        </Link>
                    </Reveal>
                </div>
            </section>

            {/* ═══════════════════════════ WHY CHOOSE US ═══════════════════════════ */}
            <section style={{ ...S.section, background: 'linear-gradient(135deg, var(--bg) 0%, #0d1208 100%)' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }} className="why-grid">
                        <div>
                            <Reveal>
                                <span style={S.label}>Why Buggy Foods</span>
                                <h2 style={{ ...S.heading, marginBottom: 14 }}>Crafted for <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Perfection</em></h2>
                                <p style={{ ...S.sub, marginBottom: 44 }}>Every detail matters — from farm to fork, we commit to an unparalleled dining experience that you will cherish.</p>
                            </Reveal>
                            <StaggerReveal style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                                {FEATURES.map((f, i) => (
                                    <motion.div key={i} variants={fadeUp}
                                        style={{ ...S.glass, borderRadius: 20, padding: '26px 22px', transition: 'all 0.35s' }}
                                        whileHover={{ borderColor: 'rgba(212,175,55,0.3)', y: -5, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
                                        <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: '1.3rem', marginBottom: 16 }}>{f.icon}</div>
                                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--cream)', marginBottom: 6 }}>{f.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</div>
                                    </motion.div>
                                ))}
                            </StaggerReveal>
                        </div>
                        <Reveal variants={fadeRight} style={{ position: 'relative' }} className="why-img-wrap">
                            <div style={{ borderRadius: 28, overflow: 'hidden', height: 540, boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
                                <img src={WHY_IMG} alt="Restaurant interior" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ position: 'absolute', bottom: -24, right: -24, background: 'var(--gold)', color: '#000', borderRadius: 20, padding: '18px 22px', textAlign: 'center', fontWeight: 700 }}>
                                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', lineHeight: 1 }}>28+</div>
                                <div style={{ fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>Years of<br />Excellence</div>
                            </motion.div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════ OFFER BANNER ═══════════════════════════ */}
            <section style={{ padding: '0 6% 100px' }}>
                <Reveal>
                    <div style={{ borderRadius: 28, overflow: 'hidden', position: 'relative', minHeight: 380, display: 'flex', alignItems: 'center' }}>
                        <img src={OFFER_BG} alt="Special Offer" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.3)' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%)' }} />
                        <div style={{ position: 'relative', zIndex: 2, padding: '60px 70px' }}>
                            <div style={{ display: 'inline-block', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 18px', borderRadius: 50, marginBottom: 22 }}>
                                🔥 Limited Time · 50% OFF
                            </div>
                            <h2 style={{ ...S.heading, fontSize: 'clamp(2rem,4.5vw,3.2rem)', marginBottom: 16 }}>
                                Chef's Grand <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Tasting Set</em>
                            </h2>
                            <p style={{ ...S.sub, color: 'rgba(255,255,255,0.7)', marginBottom: 36 }}>
                                7-course degustation experience — appetiser to dessert — at half price this weekend only. Tables filling fast.
                            </p>
                            <Link to="/reservation" className="btn btn-gold" style={{ padding: '14px 36px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                                <FaFireAlt /> Claim the Offer
                            </Link>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* ═══════════════════════════ CHEF SECTION ═══════════════════════════ */}
            <section style={{ ...S.section, background: 'var(--bg-2)' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="chef-grid">
                        <Reveal variants={fadeLeft} style={{ position: 'relative' }} className="chef-img-wrap">
                            <div style={{ borderRadius: 28, overflow: 'hidden', height: 600, boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
                                <img src={CHEF_IMG} alt="Head Chef" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                            </div>
                            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ position: 'absolute', bottom: 32, right: -28, background: 'var(--gold)', color: '#000', borderRadius: 20, padding: '20px 26px', textAlign: 'center', fontWeight: 700 }}>
                                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.6rem', lineHeight: 1 }}>20+</div>
                                <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>Years of<br />Mastery</div>
                            </motion.div>
                        </Reveal>

                        <Reveal variants={fadeRight}>
                            <span style={S.label}>Meet the Artist</span>
                            <h2 style={S.heading}>Chef <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Kiran Rao</em></h2>
                            <p style={{ ...S.sub, marginBottom: 28 }}>
                                Trained at Le Cordon Bleu Paris and with over two decades of culinary mastery across three continents, Chef Kiran brings a unique fusion of classical French technique and vibrant South Asian flavours to every plate.
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.75, fontStyle: 'italic', borderLeft: '3px solid var(--gold)', paddingLeft: 20, marginBottom: 40 }}>
                                "Cooking is not just nourishment — it is memory, emotion, and art crafted for those who seek the extraordinary."
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 40 }}>
                                {[['50K+', 'Guests Served'], ['120+', 'Signature Dishes'], ['12', 'Awards Won']].map(([v, l]) => (
                                    <div key={l} style={{ textAlign: 'center', ...S.glass, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 10px' }}>
                                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.9rem', color: 'var(--gold)', fontWeight: 700 }}>{v}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{l}</div>
                                    </div>
                                ))}
                            </div>
                            <Link to="/reservation" className="btn btn-gold" style={{ padding: '14px 34px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                                <FaCalendarAlt /> Book a Table
                            </Link>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════ TESTIMONIALS ═══════════════════════════ */}
            <section style={{ ...S.section, background: 'var(--bg)' }}>
                <div className="container">
                    <Reveal style={{ textAlign: 'center', marginBottom: 64 }}>
                        <span style={S.label}>Guest Stories</span>
                        <h2 style={S.heading}>What Our <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Guests</em> Say</h2>
                    </Reveal>
                    <StaggerReveal style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
                        {TESTIMONIALS.map((t, i) => (
                            <motion.div key={i} variants={fadeUp}
                                style={{ ...S.glass, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 22, padding: 32, transition: 'all 0.35s' }}
                                whileHover={{ borderColor: 'rgba(212,175,55,0.3)', y: -6 }}>
                                <div style={{ color: 'var(--gold)', fontSize: '0.95rem', marginBottom: 16, letterSpacing: 3 }}>{'★'.repeat(t.stars)}</div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.93rem', lineHeight: 1.75, fontStyle: 'italic', marginBottom: 26, position: 'relative' }}>
                                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '3.5rem', color: 'rgba(212,175,55,0.2)', lineHeight: 0, verticalAlign: '-1.4rem', marginRight: 4 }}>"</span>
                                    {t.text}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold), var(--gold-d))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, color: '#000', flexShrink: 0 }}>{t.av}</div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 600 }}>{t.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{t.role}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </StaggerReveal>
                </div>
            </section>

            {/* ═══════════════════════════ GALLERY ═══════════════════════════ */}
            <section style={{ ...S.section, background: 'var(--bg-2)' }}>
                <div className="container">
                    <Reveal style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 20 }}>
                        <div>
                            <span style={S.label}>Visual Journey</span>
                            <h2 style={{ ...S.heading, marginBottom: 0 }}>Our <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Gallery</em></h2>
                        </div>
                        <Link to="/menu" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '12px 28px', borderRadius: 100, border: '1.5px solid rgba(212,175,55,0.4)', color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-body)', transition: 'all 0.3s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; e.currentTarget.style.borderColor = 'var(--gold)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)' }}>
                            Explore Menu <FaArrowRight />
                        </Link>
                    </Reveal>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'repeat(2,220px)', gap: 16 }}>
                        {GALLERY_IMGS.map((src, i) => (
                            <Reveal key={i} style={{ gridRow: i === 0 ? 'span 2' : 'span 1', borderRadius: 20, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                                variants={i % 2 === 0 ? fadeUp : fadeRight}>
                                <motion.div style={{ width: '100%', height: '100%', position: 'relative' }} whileHover={{ scale: 1.03 }} transition={{ duration: 0.4 }}
                                    onClick={() => setLightbox(src)}>
                                    <img src={src} alt={`Gallery ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
                                    <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} transition={{ duration: 0.3 }}
                                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ color: '#fff', fontSize: '2rem', opacity: 0.9 }}><FaPlay style={{ fontSize: '1.5rem' }} /></div>
                                    </motion.div>
                                </motion.div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════ CONTACT CTA ═══════════════════════════ */}
            <section style={{ ...S.section, background: 'var(--bg)', textAlign: 'center' }}>
                <div className="container" style={{ maxWidth: 700 }}>
                    <Reveal>
                        <span style={S.label}>Book Your Experience</span>
                        <h2 style={{ ...S.heading, fontSize: 'clamp(2.3rem,4.5vw,3.6rem)' }}>
                            Ready to <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Dine</em> With Us?
                        </h2>
                        <p style={{ ...S.sub, margin: '0 auto 40px', textAlign: 'center' }}>
                            Reserve your table today and let us create an unforgettable evening for you and your loved ones.
                        </p>
                        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link to="/reservation" className="btn btn-gold" style={{ padding: '16px 44px', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                                <FaCalendarAlt /> Reserve a Table
                            </Link>
                            <Link to="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '16px 44px', borderRadius: 100, border: '1.5px solid rgba(212,175,55,0.4)', color: 'var(--gold)', fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-body)', transition: 'all 0.3s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.08)'; e.currentTarget.style.borderColor = 'var(--gold)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)' }}>
                                <FaPhone /> Contact Us
                            </Link>
                        </div>
                        {/* Info chips */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 48, flexWrap: 'wrap' }}>
                            {[
                                { icon: <FaMapMarkerAlt />, text: '42 Gourmet Lane, Chennai' },
                                { icon: <FaClock />, text: 'Mon–Sun: 12PM – 10PM' },
                                { icon: <FaPhone />, text: '+91 98765 43210' },
                            ].map((c, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--gold)' }}>{c.icon}</span>{c.text}
                                </div>
                            ))}
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ═══════════════════════════ LIGHTBOX ═══════════════════════════ */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setLightbox(null)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', cursor: 'zoom-out' }}>
                        <motion.img src={lightbox} alt="Gallery preview" initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
                            style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: 16, objectFit: 'contain', boxShadow: '0 40px 120px rgba(0,0,0,0.8)' }} />
                        <button onClick={() => setLightbox(null)}
                            style={{ position: 'absolute', top: 24, right: 28, background: 'none', border: 'none', color: '#fff', fontSize: '1.8rem', cursor: 'pointer', opacity: 0.7, lineHeight: 1 }}>
                            <FaTimes />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Responsive overrides ─── */}
            <style>{`
        @media (max-width: 900px) {
          .hero-img-col { display: none !important; }
          #hero-section { grid-template-columns: 1fr !important; padding-top: 110px !important; text-align: center; }
          .hero-btns { justify-content: center; }
          .why-grid { grid-template-columns: 1fr !important; }
          .why-img-wrap { display: none !important; }
          .chef-grid { grid-template-columns: 1fr !important; }
          .chef-img-wrap { display: none !important; }
        }
        @media (max-width: 640px) {
          .gal-grid { grid-template-columns: 1fr 1fr !important; grid-template-rows: auto !important; }
          .gal-grid > div:first-child { grid-row: span 1 !important; }
        }
      `}</style>
        </main>
    )
}
