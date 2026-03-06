/**
 * Export an array of objects to a CSV file download
 * @param {Object[]} data
 * @param {string} filename
 * @param {string[]} [columns] - optional column whitelist
 */
export function exportToCSV(data, filename = 'export.csv', columns) {
    if (!data?.length) return

    const keys = columns || Object.keys(data[0]).filter(k => k !== '__v')
    const headers = keys.join(',')

    const rows = data.map(row =>
        keys.map(key => {
            const val = row[key] ?? ''
            const str = String(val).replace(/"/g, '""')
            return str.includes(',') || str.includes('\n') ? `"${str}"` : str
        }).join(',')
    )

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
