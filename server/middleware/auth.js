const jwt = require('jsonwebtoken')

const protect = (req, res, next) => {
    // Support both httpOnly cookie and Bearer header
    let token = req.cookies?.adminToken

    if (!token && req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized. Please log in.' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.admin = decoded
        next()
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Token is invalid or expired.' })
    }
}

const protectUser = (req, res, next) => {
    let token = req.cookies?.userToken

    if (!token && req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Please log in to continue.' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch {
        return res.status(401).json({ success: false, message: 'Token is invalid or expired.' })
    }
}

module.exports = { protect, protectUser }
