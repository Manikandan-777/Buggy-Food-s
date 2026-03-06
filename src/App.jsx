import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import MobileCTA from './components/ui/MobileCTA'
import ChatBot from './components/ChatBot'
import ProtectedRoute from './components/ProtectedRoute'
import PageTransition from './components/layout/PageTransition'

// ── Lazy-loaded pages ────────────────────────────────
const Home = lazy(() => import('./pages/Home'))
const Menu = lazy(() => import('./pages/Menu'))
const Reservation = lazy(() => import('./pages/Reservation'))
const Contact = lazy(() => import('./pages/Contact'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const MenuManager = lazy(() => import('./pages/admin/MenuManager'))
const BookingManager = lazy(() => import('./pages/admin/BookingManager'))
const UserAuth = lazy(() => import('./pages/UserAuth'))

// ── Page-level skeleton fallback ─────────────────────
function PageLoader() {
    return (
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
                <p>Loading…</p>
            </div>
        </div>
    )
}

// ── Animated route wrapper ───────────────────────────
function AnimatedRoutes() {
    const location = useLocation()
    const isAdmin = location.pathname.startsWith('/admin') && location.pathname !== '/admin'

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* Public */}
                <Route path="/" element={<><Navbar /><PageTransition><Home /></PageTransition><Footer /><MobileCTA /></>} />
                <Route path="/menu" element={<><Navbar /><PageTransition><Menu /></PageTransition><Footer /><MobileCTA /></>} />
                <Route path="/reservation" element={<><Navbar /><PageTransition><Reservation /></PageTransition><Footer /></>} />
                <Route path="/contact" element={<><Navbar /><PageTransition><Contact /></PageTransition><Footer /><MobileCTA /></>} />
                <Route path="/login" element={<><Navbar /><PageTransition><UserAuth /></PageTransition><Footer /></>} />

                {/* Admin */}
                <Route path="/admin" element={<PageTransition><AdminLogin /></PageTransition>} />
                <Route path="/admin/dashboard" element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
                <Route path="/admin/menu" element={<ProtectedRoute><PageTransition><MenuManager /></PageTransition></ProtectedRoute>} />
                <Route path="/admin/bookings" element={<ProtectedRoute><PageTransition><BookingManager /></PageTransition></ProtectedRoute>} />

                {/* 404 */}
                <Route path="*" element={
                    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ fontSize: '4rem' }}>🍽️</div>
                        <h2 style={{ color: 'var(--cream)', fontFamily: 'var(--font-heading)' }}>Page Not Found</h2>
                        <a href="/" className="btn btn-gold">Go Home</a>
                    </div>
                } />
            </Routes>
        </AnimatePresence>
    )
}

function App() {
    return (
        <HelmetProvider>
            <BrowserRouter>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: { background: 'var(--bg-2)', color: 'var(--cream)', border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'var(--font-body)' },
                    }}
                />
                <div className="app-wrapper">
                    <Suspense fallback={<PageLoader />}>
                        <AnimatedRoutes />
                    </Suspense>
                    {/* AI Concierge — available on all public pages */}
                    <ChatBot />
                </div>
            </BrowserRouter>
        </HelmetProvider>
    )
}

export default App
