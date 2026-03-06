import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DishCard from './DishCard'
import api from '../services/api'

export default function SimilarDishes({ dishId, category }) {
    const [dishes, setDishes] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!dishId && !category) { setLoading(false); return }

        const endpoint = dishId
            ? `/ml/recommendations/similar/${dishId}`
            : `/ml/recommendations/popular?limit=3`

        api.get(endpoint)
            .then(r => setDishes(r.data.data || []))
            .catch(() => setDishes([]))
            .finally(() => setLoading(false))
    }, [dishId, category])

    if (!loading && !dishes.length) return null

    return (
        <section style={{ padding: '3rem 0' }}>
            <div className="container">
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <span className="section-subtitle">AI Powered</span>
                    <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--cream)', marginTop: '0.25rem' }}>
                        You Might Also <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Love</em>
                    </h3>
                </div>

                {loading ? (
                    <div className="grid-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="dish-skeleton">
                                <div className="dish-skeleton__img" />
                                <div className="dish-skeleton__body">
                                    <div className="skeleton-line w-30" />
                                    <div className="skeleton-line w-80 h-16" />
                                    <div className="skeleton-line w-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid-3">
                        {dishes.map((item, i) => (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <DishCard item={item} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
