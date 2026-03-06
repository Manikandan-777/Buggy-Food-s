import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { menuAPI } from '../services/api'
import toast from 'react-hot-toast'

const MenuContext = createContext()

export function MenuProvider({ children }) {
    const [menuItems, setMenuItems] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const fetchMenu = useCallback(async (params = {}) => {
        setLoading(true)
        setError(null)
        try {
            const res = await menuAPI.getAll(params)
            setMenuItems(res.data.data)
            setTotalPages(res.data.totalPages)
            setTotal(res.data.total)
            setPage(params.page || 1)
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to load menu. Is the server running?'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchMenu({ limit: 12 }) }, [fetchMenu])

    const addItem = async (formData) => {
        const res = await menuAPI.create(formData)
        await fetchMenu({ page, limit: 12 })
        return res.data.data
    }

    const updateItem = async (id, formData) => {
        await menuAPI.update(id, formData)
        await fetchMenu({ page, limit: 12 })
    }

    const deleteItem = async (id) => {
        await menuAPI.delete(id)
        await fetchMenu({ page, limit: 12 })
        toast.success('Dish deleted successfully')
    }

    return (
        <MenuContext.Provider value={{ menuItems, loading, error, page, totalPages, total, fetchMenu, addItem, updateItem, deleteItem }}>
            {children}
        </MenuContext.Provider>
    )
}

export const useMenu = () => useContext(MenuContext)
