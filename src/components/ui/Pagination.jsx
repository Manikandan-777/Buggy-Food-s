export default function Pagination({ page, totalPages, onPageChange }) {
    if (!totalPages || totalPages <= 1) return null

    const pages = []
    const delta = 2
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
            pages.push(i)
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...')
        }
    }

    return (
        <div className="pagination">
            <button onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Previous page">
                ← Prev
            </button>
            {pages.map((p, i) =>
                p === '...' ? (
                    <span key={`dots-${i}`} style={{ color: 'var(--text-muted)', padding: '0 0.2rem' }}>…</span>
                ) : (
                    <button
                        key={p}
                        className={p === page ? 'active' : ''}
                        onClick={() => onPageChange(p)}
                        aria-label={`Page ${p}`}
                        aria-current={p === page ? 'page' : undefined}
                    >
                        {p}
                    </button>
                )
            )}
            <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} aria-label="Next page">
                Next →
            </button>
        </div>
    )
}
