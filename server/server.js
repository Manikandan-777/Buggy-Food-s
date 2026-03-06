require('dotenv').config()
const express = require('express')
const http = require('http')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const mongoSanitize = require('express-mongo-sanitize')
const { Server } = require('socket.io')
const connectDB = require('./config/db')
const { loginLimiter, bookingLimiter } = require('./middleware/rateLimiter')

connectDB()

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }
})

// Make io accessible in routes
app.set('io', io)

// ── Security ──────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }))
app.use(mongoSanitize())

// ── Performance ───────────────────────────────────────
app.use(compression())

// ── Core Middleware ────────────────────────────────────
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Dev logger
if (process.env.NODE_ENV === 'development') {
    app.use((req, _res, next) => {
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`)
        next()
    })
}

// ── Routes ─────────────────────────────────────────────
app.use('/api/auth', loginLimiter, require('./routes/auth'))
app.use('/api/user', require('./routes/user'))
app.use('/api/menu', require('./routes/menu'))
app.use('/api/bookings', bookingLimiter, require('./routes/booking'))
app.use('/api/contact', require('./routes/contact'))
app.use('/api/analytics', require('./routes/analytics'))   // 🆕 AI Analytics
app.use('/api/ml', require('./routes/ml'))           // 🆕 ML Proxy

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'Buggy Foods API is running 🍽️', timestamp: new Date() })
})

// ── Socket.io ──────────────────────────────────────────
io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`)
    socket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`)
    })
})

// ── Error Handlers ─────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' })
})

app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err.stack)
    res.status(500).json({ success: false, message: err.message || 'Server error' })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`)
    console.log(`🔒 Security: Helmet + MongoSanitize + Rate Limiting`)
    console.log(`📋 Environment: ${process.env.NODE_ENV}`)
    console.log(`🗄️  Database: ${process.env.MONGO_URI}\n`)
})
