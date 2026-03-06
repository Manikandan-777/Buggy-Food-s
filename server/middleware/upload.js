const multer = require('multer')
const path = require('path')

// Detect if Cloudinary is configured
const isCloudinaryConfigured =
    process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_KEY && process.env.CLOUDINARY_SECRET

let storage

if (isCloudinaryConfigured) {
    const { CloudinaryStorage } = require('multer-storage-cloudinary')
    const cloudinary = require('../config/cloudinary')

    storage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: 'buggy-foods/menu',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [{ width: 800, height: 600, crop: 'fill', quality: 'auto' }],
        },
    })
} else {
    // Fallback: local disk storage
    storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads/'),
        filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
    })
}

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false)
    }
}

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
    fileFilter,
})

module.exports = upload
