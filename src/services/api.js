import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // send httpOnly cookies automatically
    headers: { 'Content-Type': 'application/json' },
})

// Attach Bearer token as fallback (for backward compatibility)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Global 401 handler
api.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('adminToken')
            localStorage.removeItem('adminUser')
        }
        return Promise.reject(err)
    }
)

// ── Auth ────────────────────────────────────────────
export const authAPI = {
    login: (creds) => api.post('/auth/login', creds),
    logout: () => api.post('/auth/logout'),
    verify: () => api.get('/auth/verify'),
}

// ── User (Customer) ─────────────────────────────────
export const userAPI = {
    register: (data) => api.post('/user/register', data),
    login: (data) => api.post('/user/login', data),
    logout: () => api.post('/user/logout'),
    me: () => api.get('/user/me'),
}

// ── Menu ────────────────────────────────────────────
export const menuAPI = {
    getAll: (params) => api.get('/menu', { params }),
    getOne: (id) => api.get(`/menu/${id}`),
    create: (data) => api.post('/menu', data),
    update: (id, d) => api.put(`/menu/${id}`, d),
    delete: (id) => api.delete(`/menu/${id}`),
}

// ── Bookings ─────────────────────────────────────────
export const bookingAPI = {
    getAll: (params) => api.get('/bookings', { params }),
    create: (data) => api.post('/bookings', data),
    update: (id, d) => api.put(`/bookings/${id}`, d),
    delete: (id) => api.delete(`/bookings/${id}`),
}

// ── Contact ──────────────────────────────────────────
export const contactAPI = {
    submit: (data) => api.post('/contact', data),
    getAll: () => api.get('/contact'),
    markRead: (id) => api.put(`/contact/${id}/read`),
    delete: (id) => api.delete(`/contact/${id}`),
}

// Legacy named exports for backward compatibility
export const loginAdmin = (c) => authAPI.login(c)
export const verifyToken = () => authAPI.verify()
export const getMenuItems = (p) => menuAPI.getAll(p)
export const addMenuItem = (d) => menuAPI.create(d)
export const updateMenuItem = (id, d) => menuAPI.update(id, d)
export const deleteMenuItem = (id) => menuAPI.delete(id)
export const getBookings = (p) => bookingAPI.getAll(p)
export const createBooking = (d) => bookingAPI.create(d)
export const updateBookingStatus = (id, s) => bookingAPI.update(id, { status: s })
export const deleteBooking = (id) => bookingAPI.delete(id)
export const submitContact = (d) => contactAPI.submit(d)
export const getEnquiries = () => contactAPI.getAll()
export const markEnquiryRead = (id) => contactAPI.markRead(id)
export const deleteEnquiry = (id) => contactAPI.delete(id)

export default api
