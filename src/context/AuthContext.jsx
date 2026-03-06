import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import { disconnectSocket } from '../hooks/useSocket'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
    const [adminUser, setAdminUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data } = await authAPI.verify()
                if (data.success) {
                    setIsAdminLoggedIn(true)
                    setAdminUser(data.admin)
                } else {
                    clearAuth()
                }
            } catch {
                clearAuth()
            } finally {
                setLoading(false)
            }
        }
        checkAuth()
    }, [])

    const clearAuth = () => {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        setIsAdminLoggedIn(false)
        setAdminUser(null)
        disconnectSocket()
    }

    const login = async (username, password) => {
        const { data } = await authAPI.login({ username, password })
        if (data.success) {
            // Keep token in localStorage as fallback for verify requests
            if (data.token) localStorage.setItem('adminToken', data.token)
            setIsAdminLoggedIn(true)
            setAdminUser(data.admin)
            return { success: true }
        }
        return { success: false, message: data.message }
    }

    const logout = async () => {
        try { await authAPI.logout() } catch { }
        clearAuth()
    }

    return (
        <AuthContext.Provider value={{ isAdminLoggedIn, adminUser, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
