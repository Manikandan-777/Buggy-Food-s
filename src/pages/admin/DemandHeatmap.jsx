import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { FaFire } from 'react-icons/fa'
import api from '../../services/api'

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: 'var(--bg-3)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '10px', padding: '0.6rem 0.9rem' }}>
            <p style={{ fontFamily: 'var(--font-heading)', color: 'var(--cream)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{label}</p>
            <p style={{ color: 'var(--gold)', fontSize: '0.83rem' }}>{payload[0].value} expected bookings</p>
        </div>
    )
}

export default function DemandHeatmap() {
    const [chartData, setChartData] = useState([])
    const [busy, setBusy] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeDay, setActiveDay] = useState(5)   // default: Saturday

    useEffect(() => {
        api.get('/ml/predictions/demand/week')
            .then(r => {
                const preds = r.data.predictions || {}
                const data = DAYS_FULL.map((day, i) => ({
                    day: DAYS_SHORT[i],
                    total: preds[day] ? Object.values(preds[day]).reduce((a, b) => a + b, 0).toFixed(1) : 0,
                    hours: preds[day] || {},
                }))
                setChartData(data)
            })
            .catch(() => setChartData([]))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        api.get(`/ml/predictions/demand/busy-hours?day=${activeDay}`)
            .then(r => setBusy(r.data.busiest || []))
            .catch(() => setBusy([]))
    }, [activeDay])

    const maxVal = Math.max(...chartData.map(d => parseFloat(d.total) || 0), 1)

    return (
        <div className="chart-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <FaFire style={{ color: 'var(--gold)', fontSize: '1rem' }} />
                    <p className="chart-title" style={{ margin: 0 }}>📈 Predicted Booking Demand</p>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '100px', padding: '0.2rem 0.7rem' }}>
                    AI-Powered Forecast
                </span>
            </div>

            {loading ? (
                <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: '0.5rem', paddingBottom: '1rem' }}>
                    {DAYS_SHORT.map(d => (
                        <div key={d} style={{ flex: 1, background: 'linear-gradient(90deg, #1C1C1C 25%, #242424 50%, #1C1C1C 75%)', backgroundSize: '600px 100%', animation: 'shimmer 1.6s infinite linear', borderRadius: '6px 6px 0 0', height: `${30 + Math.random() * 80}%` }} />
                    ))}
                </div>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={chartData} barCategoryGap="20%" onClick={(data) => { if (data?.activePayload) setActiveDay(DAYS_SHORT.indexOf(data.activePayload[0].payload.day)) }}>
                            <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis hide />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(212,175,55,0.06)' }} />
                            <Bar dataKey="total" radius={[6, 6, 0, 0]} style={{ cursor: 'pointer' }}>
                                {chartData.map((entry, idx) => (
                                    <Cell key={idx}
                                        fill={idx === activeDay ? 'var(--gold)' : parseFloat(entry.total) >= (maxVal * 0.7) ? 'rgba(212,175,55,0.65)' : 'rgba(212,175,55,0.22)'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Busiest hours for selected day */}
                    {busy.length > 0 && (
                        <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(212,175,55,0.05)', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.12)' }}>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                🔥 Busiest slots — {DAYS_FULL[activeDay]}
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {busy.map((slot, i) => (
                                    <div key={slot.hour} style={{ flex: 1, textAlign: 'center', padding: '0.45rem', background: i === 0 ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)', borderRadius: '8px', border: `1px solid ${i === 0 ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                                        <div style={{ fontFamily: 'var(--font-heading)', color: i === 0 ? 'var(--gold)' : 'var(--cream)', fontSize: '0.9rem', fontWeight: 700 }}>{slot.hour}</div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{slot.expected} bookings</div>
                                    </div>
                                ))}
                            </div>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Click a bar to see that day's busy hours</p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
