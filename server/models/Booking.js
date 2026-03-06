const mongoose = require('mongoose')

const BookingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Guest name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
        type: String,
        required: false,
        default: '',
        validate: {
            validator: function (v) {
                // Allow empty string (chatbot bookings) or valid 10-digit phone
                return !v || /^[0-9]{10}$/.test(v.replace(/\s/g, ''))
            },
            message: 'Please enter a valid 10-digit phone number'
        }
    },
    date: {
        type: String,
        required: [true, 'Reservation date is required'],
    },
    time: {
        type: String,
        required: [true, 'Time slot is required'],
    },
    guests: {
        type: Number,
        required: [true, 'Number of guests is required'],
        min: [1, 'At least 1 guest required'],
        max: [20, 'Maximum 20 guests allowed'],
    },
    requests: {
        type: String,
        trim: true,
        default: '',
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Cancelled'],
        default: 'Pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

module.exports = mongoose.model('Booking', BookingSchema)
