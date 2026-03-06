import { useState, useEffect } from 'react'

export function useDebounce(value, delay = 400) {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const id = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(id)
    }, [value, delay])

    return debouncedValue
}
