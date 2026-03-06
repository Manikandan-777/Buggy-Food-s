const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
    },
})

const sendBookingConfirmation = async (booking) => {
    if (!process.env.NODEMAILER_USER || !process.env.NODEMAILER_PASS) {
        console.log('⚠️  Email not configured — skipping booking confirmation email.')
        return
    }

    const ref = booking._id.toString().slice(-6).toUpperCase()

    await transporter.sendMail({
        from: `"Buggy Foods 🍽️" <${process.env.NODEMAILER_USER}>`,
        to: booking.email,
        subject: `Reservation Confirmed — Ref #${ref} | Buggy Foods`,
        html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family:Arial,sans-serif;background:#0D0608;color:#F5EFE0;padding:2rem;">
        <div style="max-width:520px;margin:0 auto;background:#160A0F;border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:2rem;">
          <h1 style="color:#D4AF37;font-size:1.5rem;margin-bottom:0.5rem;">🍽️ Buggy Foods</h1>
          <h2 style="color:#F5EFE0;margin-bottom:1.5rem;">Reservation Confirmed!</h2>
          <p>Hi <strong style="color:#D4AF37;">${booking.name}</strong>,</p>
          <p>Your table has been successfully reserved. Here are the details:</p>
          <table style="width:100%;border-collapse:collapse;margin:1.5rem 0;">
            <tr><td style="padding:0.6rem;color:#9A8A8A;">📅 Date</td><td style="padding:0.6rem;color:#F5EFE0;font-weight:600;">${booking.date}</td></tr>
            <tr style="background:rgba(212,175,55,0.05);"><td style="padding:0.6rem;color:#9A8A8A;">🕐 Time</td><td style="padding:0.6rem;color:#F5EFE0;font-weight:600;">${booking.time}</td></tr>
            <tr><td style="padding:0.6rem;color:#9A8A8A;">👥 Guests</td><td style="padding:0.6rem;color:#F5EFE0;font-weight:600;">${booking.guests}</td></tr>
            <tr style="background:rgba(212,175,55,0.05);"><td style="padding:0.6rem;color:#9A8A8A;">🔖 Reference</td><td style="padding:0.6rem;color:#D4AF37;font-weight:700;">#${ref}</td></tr>
          </table>
          ${booking.requests ? `<p style="background:rgba(212,175,55,0.06);border-left:3px solid #D4AF37;padding:0.75rem 1rem;border-radius:4px;font-size:0.9rem;">Special Request: ${booking.requests}</p>` : ''}
          <p style="color:#9A8A8A;font-size:0.85rem;margin-top:1.5rem;">If you need to cancel or modify your reservation, please contact us at <a href="mailto:reservations@buggyfoods.in" style="color:#D4AF37;">reservations@buggyfoods.in</a></p>
          <hr style="border-color:rgba(212,175,55,0.15);margin:1.5rem 0;">
          <p style="color:#9A8A8A;font-size:0.8rem;text-align:center;">© 2026 Buggy Foods. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
    })

    console.log(`📧 Confirmation email sent to ${booking.email}`)
}

const sendContactAck = async (enquiry) => {
    if (!process.env.NODEMAILER_USER || !process.env.NODEMAILER_PASS) return

    await transporter.sendMail({
        from: `"Buggy Foods 🍽️" <${process.env.NODEMAILER_USER}>`,
        to: enquiry.email,
        subject: `We received your message — Buggy Foods`,
        html: `<div style="font-family:Arial,sans-serif;">
      <h2 style="color:#D4AF37;">Thank you, ${enquiry.name}!</h2>
      <p>We received your message about "<strong>${enquiry.subject}</strong>" and will get back to you within 24 hours.</p>
      <p>— The Buggy Foods Team</p>
    </div>`,
    })
}

module.exports = { sendBookingConfirmation, sendContactAck }
