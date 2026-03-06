import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getBookings, createBooking, updateBookingStatus, deleteBooking } from '../services/api'
import { useAuth } from './AuthContext'

const BookingContext = createContext()

export function BookingProvider({ children }) {
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(false)
    const { isAdminLoggedIn } = useAuth()

    const fetchBookings = useCallback(async () => {
        if (!isAdminLoggedIn) return
        try {
            setLoading(true)
            const { data } = await getBookings()
            setBookings(data.data || [])
        } catch (err) {
            console.error('Failed to fetch bookings:', err)
        } finally {
            setLoading(false)
        }
    }, [isAdminLoggedIn])

    useEffect(() => {
        if (isAdminLoggedIn) fetchBookings()
    }, [isAdminLoggedIn, fetchBookings])

    const addBooking = async (bookingData) => {
        const { data } = await createBooking(bookingData)
        return data.data
    }

    const updateStatus = async (id, status) => {
        const { data } = await updateBookingStatus(id, status)
        setBookings(prev => prev.map(b => b._id === id ? data.data : b))
    }

    const removeBooking = async (id) => {
        await deleteBooking(id)
        setBookings(prev => prev.filter(b => b._id !== id))
    }

    return (
        <BookingContext.Provider value={{ bookings, loading, fetchBookings, addBooking, updateStatus, deleteBooking: removeBooking }}>
            {children}
        </BookingContext.Provider>
    )
}

export const useBooking = () => useContext(BookingContext)
