import { useEffect, useState } from 'react'
import { FaTrophy, FaExclamationTriangle, FaLightbulb } from 'react-icons/fa'
import api from '../../services/api'

export default function AIInsights() {
    const [top, setTop] = useState([])
    const [low, setLow] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            api.get('/analytics/top-dishes'),
            api.get('/analytics/low-performing'),
        ]).then(([topRes, lowRes]) => {
            setTop(topRes.data.data?.slice(0, 5) || [])
            setLow(lowRes.data.data?.slice(0, 5) || [])
        }).catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {[1, 2].map(i => (
                    <div key={i} className="chart-card">
                        {[...Array(5)].map((_, j) => (
                            <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <div className="skeleton-line w-60 h-16" style={{ border: 'none' }} />
                                <div className="skeleton-line w-30 h-16" style={{ border: 'none' }} />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Top Performers */}
            <div className="chart-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    <FaTrophy style={{ color: 'var(--gold)', fontSize: '1rem' }} />
                    <p className="chart-title" style={{ margin: 0 }}>Top Selling Dishes</p>
                </div>
                {top.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No order data yet. Orders will appear here once customers place them.</p>
                ) : (
                    top.map((d, i) => (
                        <div key={d._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${i === 0 ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: i === 0 ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>
                                    {i + 1}
                                </span>
                                <span style={{ fontSize: '0.88rem', color: 'var(--cream)' }}>{d.name}</span>
                            </div>
                            <span className="badge badge-gold">{d.orderCount} orders</span>
                        </div>
                    ))
                )}
            </div>

            {/* Low Performers */}
            <div className="chart-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    <FaExclamationTriangle style={{ color: 'var(--error)', fontSize: '0.9rem' }} />
                    <p className="chart-title" style={{ margin: 0 }}>Low Performers</p>
                </div>
                {low.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>All dishes are performing well!</p>
                ) : (
                    low.map(d => (
                        <div key={d._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <span style={{ fontSize: '0.88rem', color: 'var(--cream)' }}>{d.name}</span>
                            <span className="badge" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.7rem' }}>{d.orderCount} orders</span>
                        </div>
                    ))
                )}
                {low.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.85rem', padding: '0.65rem', background: 'rgba(245,158,11,0.07)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <FaLightbulb style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            Consider adding promotions or removing these items to streamline the menu.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
