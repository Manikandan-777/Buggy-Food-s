const { GoogleGenerativeAI } = require('@google/generative-ai')
const MenuItem = require('../models/MenuItem')
const Booking = require('../models/Booking')

// ── Restaurant context for the LLM ──────────────────────────────────
const INFO = {
    name: 'Buggy Foods',
    address: 'Chennai, Tamil Nadu, India',
    phone: '+91 98765 43210',
    email: 'hello@buggyfoods.com',
    hours: 'Mon–Sun: 12:00 PM – 10:00 PM',
}

let genAI = null
let model = null

if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) // or gemini-1.5-pro
}

const bookingToolDescriptor = {
    name: "bookTable",
    description: "Books a table at the restaurant when the user provides all 6 mandatory details: guests, date, time, name, phone, and email. NEVER call this function if ANY of the 6 fields are missing. Instead, ask the user naturally for the missing pieces of information. For example, if they say 'Book a table for 4 tonight', ask for their name, phone number, and email. Once you have all 6 pieces of information, call this function to complete the booking.",
    parameters: {
        type: "OBJECT",
        properties: {
            guests: { type: "INTEGER", description: "Number of guests (1-20)" },
            date: { type: "STRING", description: "Date of the reservation in YYYY-MM-DD format (e.g. 2024-03-15)" },
            time: { type: "STRING", description: "Time of the reservation in HH:MM AM/PM format (e.g. 07:30 PM)" },
            name: { type: "STRING", description: "Guest's full name" },
            phone: { type: "STRING", description: "Guest's 10-digit mobile number" },
            email: { type: "STRING", description: "Guest's email address" },
        },
        required: ["guests", "date", "time", "name", "phone", "email"]
    }
}

// Keep active chat sessions in memory (for a production app, persist this)
const activeSessions = new Map()

async function getChatSession(sessionId) {
    if (!genAI) throw new Error("GEMINI_API_KEY is not configured")

    if (activeSessions.has(sessionId)) {
        return activeSessions.get(sessionId)
    }

    // Fetch the menu to give Gemini complete context
    const dishes = await MenuItem.find({}).select('name category price isVeg description tags').limit(100)
    let menuText = dishes.map(d => `- **${d.name}** (${d.category}, ${d.isVeg ? 'Veg' : 'Non-Veg'}): ₹${d.price}\n  *${d.description}*`).join('\n')

    const systemInstruction = `You are the exclusive AI Concierge for "${INFO.name}", a premium fine dining restaurant located in ${INFO.address}.
Your sole purpose is to assist guests of THIS restaurant. You must ONLY answer questions related to this restaurant — its menu, hours, location, contact, events, parking, WiFi, bookings, and food. If a user asks anything unrelated (general knowledge, other restaurants, etc.), politely redirect them to restaurant topics.

NEVER make up information. If you don't know something specific (e.g. exact dish preparation), say so and suggest the user call us.
Always give SPECIFIC answers grounded in the information provided below. Do NOT give generic food advice.

**Restaurant Details:**
- **Name:** ${INFO.name}
- **Address:** ${INFO.address}
- **Opening Hours:** ${INFO.hours} (open 7 days including weekends & holidays)
- **Phone:** ${INFO.phone}
- **Email:** ${INFO.email}
- **Instagram:** @buggyfoods
- **WiFi:** Yes, free WiFi is available. Password is provided by the server on seating.
- **Parking:** Yes, free parking for cars and two-wheelers, right next to the restaurant.
- **Ambience:** Premium fine dining — elegant, dark luxury theme with gold accents.
- **Seating Capacity:** Up to 50 guests indoor; private dining room for up to 30 guests.
- **Events:** We host birthday parties, anniversaries, corporate dining, team lunches, family get-togethers. Custom decorations and cakes available on request.
- **Delivery:** Available via Swiggy and Zomato (search "Buggy Foods"). Takeaways: call ${INFO.phone}.
- **Payment:** Cash, Credit/Debit Cards (Visa, Mastercard, RuPay), UPI (GPay, PhonePe, Paytm), Net Banking. Split billing supported.
- **Spice Levels:** All dishes can be customized — Mild, Medium, or Very Spicy. Just inform the server.
- **Dietary:** Clearly marked Veg (🟢) / Non-Veg (🔴) on menu. Jain / no-onion-garlic options available on request. Notify allergies when booking.

**The Full Menu (use this to answer specific dish questions):**
${menuText || 'Menu data not available — suggest visiting our Menu page.'}

**IMPORTANT RULES:**
1. When asked about a specific dish, answer using ONLY the menu data above. Do not invent descriptions.
2. When asked "what is the food like" or "about the hotel/restaurant", describe ${INFO.name} specifically — do NOT give generic food descriptions.
3. When asked about spice, hours, location, etc., give the specific details above.
4. Keep responses concise, warm, and hospitality-focused. Use emojis sparingly.
5. If a dish is not in the menu above, say so clearly.

**Table Booking:**
When users want to book a table, collect ALL 6 details naturally before calling bookTable:
1. Number of guests
2. Date
3. Time
4. Full name
5. 10-digit mobile number
6. Email address
Ask for missing details conversationally. You can ask for multiple at once. DO NOT call bookTable until all 6 are confirmed. DO NOT confirm the reservation without calling bookTable.`

    // Initialize with function calling
    const modelWithTools = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction,
        tools: [{ functionDeclarations: [bookingToolDescriptor] }]
    })

    const chat = modelWithTools.startChat({ history: [] })
    activeSessions.set(sessionId, chat)

    // Optional cache cleanup
    if (activeSessions.size > 1000) activeSessions.clear()

    return chat
}

async function handleLLMChat(sessionId, message) {
    try {
        const chat = await getChatSession(sessionId)
        const result = await chat.sendMessage(message)

        // Check if Gemini decided to call the bookTable function
        const call = result.response.functionCalls()?.[0]

        if (call && call.name === 'bookTable') {
            const args = call.args

            // Manually execute the "function" side effect
            const booking = await Booking.create({
                name: args.name,
                email: args.email,
                phone: args.phone || '',
                date: args.date,
                time: args.time,
                guests: Number(args.guests),
                requests: 'Booked via AI Concierge (Gemini)',
                status: 'Pending',
            })

            const confirmationMsg = `✅ **Booking Confirmed!**\n\nTable for **${args.guests} guests** on **${args.date}** at **${args.time}** under **${args.name}**.\n\n📧 Confirmation will be sent to ${args.email}\n🔖 Ref: #${booking._id.toString().slice(-6).toUpperCase()}\n\nWe look forward to serving you! 🍴`

            // Tell Gemini we succeeded (although we can just return directly in this simple design)
            await chat.sendMessage([{
                functionResponse: {
                    name: "bookTable",
                    response: { success: true, bookingId: booking._id.toString() }
                }
            }])

            return {
                success: true,
                reply: confirmationMsg,
                done: true,
                bookingId: booking._id
            }
        }

        return {
            success: true,
            reply: result.response.text(),
            done: false
        }
    } catch (err) {
        console.error('[Gemini LLM Error]', err)
        throw err
    }
}

module.exports = {
    handleLLMChat,
    isLLMConfigured: () => !!process.env.GEMINI_API_KEY
}
