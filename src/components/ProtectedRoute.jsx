import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
    const { isAdminLoggedIn } = useAuth()
    return isAdminLoggedIn ? children : <Navigate to="/admin" replace />
}
