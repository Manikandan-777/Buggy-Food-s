import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaSearch, FaTimes } from 'react-icons/fa'
import { useMenu } from '../context/MenuContext'
import DishCard from '../components/DishCard'
import DishCardSkeleton from '../components/menu/DishCardSkeleton'
import Pagination from '../components/ui/Pagination'
import { useDebounce } from '../hooks/useDebounce'

const CATEGORIES = ['All', 'Starters', 'Mains', 'Desserts', 'Drinks']
const LIMIT = 12

export default function Menu() {
    const { menuItems, loading, error, page, totalPages, total, fetchMenu } = useMenu()
    const [active, setActive] = useState('All')
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 400)

    const load = useCallback((newPage = 1, cat = active, q = debouncedSearch) => {
        const params = { page: newPage, limit: LIMIT }
        if (cat !== 'All') params.category = cat
        if (q.trim()) params.search = q.trim()
        fetchMenu(params)
    }, [active, debouncedSearch, fetchMenu])

    // Re-fetch when category or debounced search changes
    useEffect(() => { load(1) }, [active, debouncedSearch])

    const handleCat = (cat) => { setActive(cat); setSearch('') }
    const handlePage = (p) => { load(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }

    return (
        <main className="page-content" style={{ paddingTop: '80px' }}>
            <Helmet>
                <title>Menu — Buggy Foods | 100+ Premium Dishes</title>
                <meta name="description" content="Browse Buggy Foods full menu — 25 starters, 35 mains, 20 desserts, 20 drinks. Filter by category or search." />
            </Helmet>

            {/* Hero */}
            <div className="page-hero">
                <div className="page-hero-content">
                    <span className="section-subtitle">Culinary Delights</span>
                    <h1 className="section-title">Our <span>Menu</span></h1>
                    <div className="ornament"><div className="ornament-diamond" /></div>
                    <p className="section-desc">From starters to desserts, every dish is a masterpiece crafted with love.</p>
                </div>
            </div>

            <section className="section">
                <div className="container">
                    {/* Controls */}
                    <div className="menu-controls">
                        <div className="search-wrap">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                className="form-input search-input"
                                placeholder="Search dishes…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                aria-label="Search dishes"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                    aria-label="Clear search"
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>
                        <div className="cat-tabs">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    className={`cat-tab${active === cat ? ' active' : ''}`}
                                    onClick={() => handleCat(cat)}
                                    aria-pressed={active === cat}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Count line */}
                    {!loading && !error && (
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                            Showing <strong style={{ color: 'var(--gold)' }}>{menuItems.length}</strong>
                            {' '} of <strong style={{ color: 'var(--gold)' }}>{total}</strong> dishes
                            {active !== 'All' && <> in <strong style={{ color: 'var(--cream)' }}>{active}</strong></>}
                            {search && <> matching "<strong style={{ color: 'var(--cream)' }}>{search}</strong>"</>}
                        </p>
                    )}

                    {/* Skeleton */}
                    {loading && (
                        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                            {Array.from({ length: LIMIT }).map((_, i) => (
                                <DishCardSkeleton key={i} />
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                            <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</p>
                            <p style={{ fontSize: '1.1rem', color: '#E74C3C' }}>{error}</p>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Make sure the backend server is running on port 5000.</p>
                            <button className="btn btn-outline-gold" style={{ marginTop: '1.5rem' }} onClick={() => load(1)}>
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Grid */}
                    {!loading && !error && menuItems.length > 0 && (
                        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                            {menuItems.map((item, i) => (
                                <motion.div
                                    key={item._id}
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(i * 0.04, 0.5), duration: 0.4 }}
                                >
                                    <DishCard item={item} />
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && !error && menuItems.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
                            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</p>
                            <p style={{ fontSize: '1.1rem' }}>No dishes found. Try a different search or category.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    <Pagination page={page} totalPages={totalPages} onPageChange={handlePage} />
                </div>
            </section>

            <style>{`
        .menu-controls { display:flex; flex-wrap:wrap; align-items:center; gap:1rem; margin-bottom:2rem; }
        .search-wrap { position:relative; flex:1; min-width:220px; max-width:340px; }
        .search-icon { position:absolute; left:1rem; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:0.85rem; }
        .search-input { padding-left:2.6rem !important; }
        .cat-tabs { display:flex; gap:0.5rem; flex-wrap:wrap; }
        .cat-tab { padding:0.5rem 1.2rem; border-radius:100px; border:1.5px solid rgba(212,168,67,0.2); background:transparent; color:var(--text-muted); font-size:0.85rem; font-weight:500; cursor:pointer; transition:var(--transition); font-family:var(--font-body); }
        .cat-tab:hover { border-color:var(--gold); color:var(--gold); }
        .cat-tab.active { background:var(--gold); color:var(--dark); border-color:var(--gold); font-weight:600; }
      `}</style>
        </main>
    )
}
