export default function ConfirmDialog({ icon = '🗑️', title = 'Are you sure?', message, confirmText = 'Yes, Delete', confirmClass = 'btn btn-danger btn-sm', onConfirm, onCancel }) {
    return (
        <div className="confirm-backdrop" onClick={onCancel}>
            <div className="confirm-card" onClick={e => e.stopPropagation()}>
                <div className="confirm-icon">{icon}</div>
                <h3 className="confirm-title">{title}</h3>
                {message && <p className="confirm-msg">{message}</p>}
                <div className="confirm-actions">
                    <button className="btn btn-outline btn-sm" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className={confirmClass} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
