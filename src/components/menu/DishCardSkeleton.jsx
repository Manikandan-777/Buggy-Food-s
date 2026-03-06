export default function DishCardSkeleton() {
    return (
        <div className="dish-skeleton">
            <div className="dish-skeleton__img" />
            <div className="dish-skeleton__body">
                <div className="skeleton-line w-30" />
                <div className="skeleton-line w-80 h-16" />
                <div className="skeleton-line w-100" />
                <div className="skeleton-line w-60" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <div className="skeleton-line h-20" style={{ width: '35%' }} />
                    <div className="skeleton-line h-16" style={{ width: '25%' }} />
                </div>
            </div>
        </div>
    )
}
