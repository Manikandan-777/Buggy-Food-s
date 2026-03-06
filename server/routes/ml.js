const express = require('express')
const router = express.Router()
const MenuItem = require('../models/MenuItem')
const Booking = require('../models/Booking')
const { handleLLMChat, isLLMConfigured } = require('../services/llm')

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

/* ─────────────────────────────────────────────────────────────────
   ML proxy helper (for recommendations / predictions)
   ───────────────────────────────────────────────────────────────── */
async function mlGet(endpoint, params = {}) {
    try {
        const axios = require('axios')
        const { data } = await axios.get(`${ML_URL}${endpoint}`, { params, timeout: 4000 })
        return { ok: true, data }
    } catch {
        return { ok: false }
    }
}

/* ─────────────────────────────────────────────────────────────────
   RECOMMENDATIONS
   ───────────────────────────────────────────────────────────────── */
router.get('/recommendations/popular', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6
        let items = await MenuItem.find({ orderCount: { $gt: 0 } })
            .sort({ orderCount: -1 }).limit(limit)
            .select('name category price image isVeg description featured orderCount')
        if (items.length < 3)
            items = await MenuItem.find({ featured: true }).limit(limit)
                .select('name category price image isVeg description featured orderCount')
        res.json({ success: true, data: items })
    } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

router.get('/recommendations/similar/:dishId', async (req, res) => {
    const { dishId } = req.params
    const topK = parseInt(req.query.top_k) || 4
    const ml = await mlGet(`/recommendations/similar/${dishId}`, { top_k: topK })
    if (ml.ok && ml.data.similar?.length) {
        const dishes = await MenuItem.find({ _id: { $in: ml.data.similar } })
            .select('name category price image isVeg description featured')
        return res.json({ success: true, data: dishes, source: 'ml' })
    }
    try {
        const dish = await MenuItem.findById(dishId)
        if (!dish) return res.status(404).json({ success: false, message: 'Dish not found' })
        const similar = await MenuItem.find({ category: dish.category, _id: { $ne: dish._id } })
            .limit(topK).select('name category price image isVeg description featured')
        res.json({ success: true, data: similar, source: 'category-fallback' })
    } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

/* ─────────────────────────────────────────────────────────────────
   DEMAND PREDICTIONS
   ───────────────────────────────────────────────────────────────── */
router.get('/predictions/demand/week', async (req, res) => {
    const ml = await mlGet('/predictions/demand/week')
    if (ml.ok) return res.json({ success: true, ...ml.data })
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const mock = {}
    DAYS.forEach((d, i) => { mock[d] = {}; for (let h = 12; h <= 21; h++) mock[d][`${h}:00`] = +(i >= 4 ? (3 + Math.random() * 4) : (1 + Math.random() * 3)).toFixed(1) })
    res.json({ success: true, predictions: mock, source: 'mock-fallback' })
})

router.get('/predictions/demand/busy-hours', async (req, res) => {
    const { day = 5 } = req.query
    const ml = await mlGet('/predictions/demand/busy-hours', { day })
    if (ml.ok) return res.json({ success: true, ...ml.data })
    res.json({ success: true, busiest: [{ hour: '20:00', expected: 4.5 }, { hour: '19:00', expected: 3.8 }, { hour: '21:00', expected: 3.2 }], source: 'mock' })
})

/* ═══════════════════════════════════════════════════════════════════
   AI RESTAURANT CHATBOT  –  Intent Detection + Q&A + Booking Mode
   POST /api/ml/chat/message
   ═══════════════════════════════════════════════════════════════════ */

// ── Restaurant info ─────────────────────────────────────────────
const INFO = {
    name: 'Buggy Foods',
    address: 'Chennai, Tamil Nadu, India',
    phone: '+91 98765 43210',
    email: 'hello@buggyfoods.com',
    hours: 'Mon–Sun: 12:00 PM – 10:00 PM',
    instagram: '@buggyfoods',
}

/* ═══════════════════════════════════════════════════════════════════
   ADVANCED NLP ENGINE
   ─ Levenshtein fuzzy matching  (catches ALL typos)
   ─ Token-level confidence scoring per intent
   ─ Word stemming (ordering/ordered/orders → order)
   ─ Slang / shorthand normalisation
   ─ Full phrase + partial phrase + token matching
   ─ Selects best-confidence intent above threshold
   Effectively covers millions of input variations.
   ═══════════════════════════════════════════════════════════════════ */

// ── 1. Levenshtein distance ────────────────────────────────────────
function levenshtein(a, b) {
    const m = a.length, n = b.length
    if (m === 0) return n
    if (n === 0) return m
    const dp = Array.from({ length: m + 1 }, (_, i) => [i])
    for (let j = 0; j <= n; j++) dp[0][j] = j
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    return dp[m][n]
}

// ── 2. Porter-style English stemmer ───────────────────────────────
function stem(word) {
    return word
        .replace(/(?:ing|tion|tions|ness|ment|ments|ful|less|ive|able|ible|al|ial|ed|er|est|ly|ies|es|s)$/, '')
        .replace(/e$/, '')
}

// ── 3. Slang & shorthand dictionary ───────────────────────────────
const SLANG = {
    // Greetings & social
    'hi': 'hello', 'hii': 'hello', 'hiii': 'hello', 'hey': 'hello', 'hola': 'hello',
    'helo': 'hello', 'heyyy': 'hello', 'haai': 'hello', 'hai': 'hello', 'hoi': 'hello',
    'sup': 'hello', 'wassup': 'hello', 'wazzup': 'hello', 'yo': 'hello', 'yoo': 'hello',
    'heya': 'hello', 'hiya': 'hello', 'howdy': 'hello', 'ola': 'hello', 'namaste': 'hello',
    'vanakkam': 'hello', 'namaskar': 'hello', 'salaam': 'hello', 'salam': 'hello',
    // Positives
    'gr8': 'great', 'grt': 'great', 'gud': 'good', 'gd': 'good', 'nyc': 'nice',
    'awsm': 'awesome', 'awsome': 'awesome', 'amzng': 'amazing', 'amazng': 'amazing',
    'lol': 'okay', 'lmao': 'okay', 'haha': 'okay', 'hehe': 'okay',
    // Negatives / questions
    'wht': 'what', 'wat': 'what', 'wats': 'what', 'wut': 'what', 'wot': 'what',
    'hw': 'how', 'hws': 'how', 'whr': 'where', 'wr': 'where', 'wen': 'when', 'whn': 'when',
    'hw mch': 'how much', 'hw much': 'how much', 'how mch': 'how much',
    // Confirmations
    'yep': 'yes', 'yup': 'yes', 'yeah': 'yes', 'yah': 'yes', 'yea': 'yes', 'ya': 'yes',
    'nope': 'no', 'nah': 'no', 'na': 'no', 'naw': 'no',
    'ok': 'okay', 'okk': 'okay', 'okkkk': 'okay', 'oky': 'okay', 'okie': 'okay', 'kk': 'okay',
    'k': 'okay', 'aight': 'okay', 'alright': 'okay', 'sure': 'okay', 'cool': 'okay',
    'gotcha': 'okay', 'bet': 'okay', 'noted': 'okay', 'understood': 'okay',
    // Please / thanks
    'pls': 'please', 'plz': 'please', 'plss': 'please', 'plsss': 'please', 'plzzz': 'please',
    'thnk': 'thank', 'thnks': 'thanks', 'thx': 'thanks', 'ty': 'thanks', 'tysm': 'thanks',
    'thx': 'thanks', 'tnx': 'thanks', 'tq': 'thanks', 'tyvm': 'thanks', '10q': 'thanks',
    // Time
    '2day': 'today', '2morrow': 'tomorrow', '2mrw': 'tomorrow', 'tmrw': 'tomorrow',
    'tmrow': 'tomorrow', 'tonite': 'tonight', '2nite': 'tonight', '2night': 'tonight',
    'nxt wk': 'next week', 'lst wk': 'last week', 'nxt mnth': 'next month',
    // Numbers as letters
    '4': 'for', '2': 'to', '8': 'ate', 'b4': 'before', 'l8r': 'later', 'c u': 'see you',
    // Common contractions (without apostrophe)
    'cant': 'cannot', 'wont': 'will not', 'dont': 'do not', 'doesnt': 'does not',
    'isnt': 'is not', 'arent': 'are not', 'didnt': 'did not', 'havent': 'have not',
    'shouldnt': 'should not', 'wouldnt': 'would not', 'couldnt': 'could not',
    'im': 'i am', 'ive': 'i have', 'ill': 'i will', 'id': 'i would', 'itll': 'it will',
    // Restaurant-specific misspellings
    'resturant': 'restaurant', 'restarant': 'restaurant', 'restaurnt': 'restaurant',
    'resterant': 'restaurant', 'resturent': 'restaurant', 'restraunt': 'restaurant',
    'restaurent': 'restaurant', 'restorant': 'restaurant', 'restarnt': 'restaurant',
    'manu': 'menu', 'mneu': 'menu', 'meu': 'menu', 'mennu': 'menu', 'meno': 'menu',
    'biryaani': 'biryani', 'briyani': 'biryani', 'biriyani': 'biryani', 'birjani': 'biryani',
    'biriyan': 'biryani', 'bryani': 'biryani', 'biryni': 'biryani', 'biriani': 'biryani',
    'panir': 'paneer', 'panneer': 'paneer', 'pneer': 'paneer',
    'chiken': 'chicken', 'chikken': 'chicken', 'chiecken': 'chicken', 'chicekn': 'chicken',
    'chikcen': 'chicken', 'chciken': 'chicken', 'chicen': 'chicken',
    'delicous': 'delicious', 'delisious': 'delicious', 'delicios': 'delicious',
    'dilicious': 'delicious', 'delecious': 'delicious', 'deliciouss': 'delicious',
    'spicey': 'spicy', 'spicyy': 'spicy', 'spcsty': 'spicy',
    'alergy': 'allergy', 'allergi': 'allergy', 'allegry': 'allergy', 'allargy': 'allergy',
    'pament': 'payment', 'paymet': 'payment', 'paiment': 'payment', 'paymnt': 'payment',
    'coffe': 'coffee', 'cofee': 'coffee', 'koffee': 'coffee', 'coffie': 'coffee',
    'icecream': 'ice cream', 'ice-cream': 'ice cream',
    'vegitarian': 'vegetarian', 'vegiterian': 'vegetarian', 'vegeterain': 'vegetarian',
    'vegeterien': 'vegetarian', 'vegitarin': 'vegetarian', 'vegatarian': 'vegetarian',
    'nonveg': 'non veg', 'non-veg': 'non veg', 'nonvegg': 'non veg',
    'birtday': 'birthday', 'bday': 'birthday', 'b-day': 'birthday', 'brthday': 'birthday',
    'anniversy': 'anniversary', 'annivarsary': 'anniversary', 'anniversry': 'anniversary',
    'reservtion': 'reservation', 'resrvation': 'reservation', 'resertion': 'reservation',
    'cancell': 'cancel', 'cancle': 'cancel', 'canel': 'cancel',
    'delivry': 'delivery', 'delivrey': 'delivery', 'deliveri': 'delivery',
    'paking': 'parking', 'pakring': 'parking', 'parkin': 'parking',
    'wif': 'wifi', 'wify': 'wifi', 'wi fi': 'wifi',
    'contct': 'contact', 'contacr': 'contact', 'contaact': 'contact',
}

// ── 4. Text normaliser ─────────────────────────────────────────────
function normalise(raw) {
    let t = raw.toLowerCase()
    // Strip emoji and non-ASCII except common symbols
    t = t.replace(/[^\x00-\x7F]/g, ' ')
    // Remove punctuation except core characters
    t = t.replace(/[^a-z0-9\s@.+]/g, ' ')
    t = t.replace(/\s+/g, ' ').trim()
    // Apply slang map (longest matches first by sorting)
    const sortedSlang = Object.keys(SLANG).sort((a, b) => b.length - a.length)
    for (const s of sortedSlang)
        t = t.replace(new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), SLANG[s])
    return t
}

// ── 5. Intent word banks (comprehensive) ──────────────────────────
//    Each intent has:
//      phrases  – full/partial phrases that strongly signal intent (score +3 each)
//      words    – individual keywords; any token match scores +2 or fuzzy +1
//      stems    – stem roots; matched after stemming the token (+2)

const INTENT_BANKS = {
    greeting: {
        phrases: ['good morning', 'good evening', 'good afternoon', 'good day', 'good night',
            'how are you', 'how r u', 'how are u', 'how do you do', 'how is it going',
            'is anyone there', 'anyone home', 'anybody there', 'start chat', 'begin chat',
            'nice to meet you', 'pleased to meet you', 'whats up', 'what is up'],
        words: ['hi', 'hello', 'hey', 'namaste', 'howdy', 'greetings', 'hiya', 'heya', 'sup',
            'vanakkam', 'namaskaram', 'namasthe', 'welcome', 'ping', 'test', 'testing',
            'helo', 'hii', 'hiii', 'haai', 'hai', 'hoi', 'bonjour', 'ciao', 'salut',
            'aloha', 'shalom', 'merhaba', 'salaam', 'salam', 'konnichiwa', 'nihao',
            'privet', 'hallo', 'hei', 'hej', 'oi', 'olá'],
        stems: ['greet', 'welcom']
    },
    hours: {
        phrases: ['what time do you open', 'when do you open', 'when do you close',
            'are you open', 'are you open now', 'open on sunday', 'open on weekend',
            'open on holiday', 'what are your hours', 'working hours', 'business hours',
            'operation hours', 'close time', 'closing time', 'last order', 'last entry',
            'kitchen closes', 'till what time', 'how late open', 'how early open',
            'from what time', 'until what time', 'open today', 'open tomorrow',
            'lunch time', 'dinner time', 'what time open', 'do you open', 'when are you open'],
        words: ['hours', 'hour', 'open', 'opening', 'timing', 'timings', 'close', 'closing',
            'time', 'schedule', 'available', 'availability', 'operational', 'operation',
            'brunch', 'breakfast', 'lunch', 'dinner', 'supper', 'lunchtime', 'dinnertime',
            'daytime', 'evening', 'noon', 'midnight', 'weekend', 'weekday', 'monday',
            'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'holiday',
            'daily', 'every day', '7 days', '24 hours', 'round the clock', 'non stop'],
        stems: ['open', 'clos', 'tim', 'schedul', 'avail', 'oper']
    },
    location: {
        phrases: ['how to reach', 'how to get there', 'how to come', 'how to find you',
            'show me the way', 'give me directions', 'where are you located',
            'where is the restaurant', 'which area', 'which city', 'which street',
            'near which landmark', 'how far', 'how many km', 'how many kilometres',
            'distance from', 'nearest bus stop', 'nearest metro', 'nearest subway'],
        words: ['location', 'address', 'where', 'find', 'direction', 'directions', 'map',
            'place', 'situated', 'located', 'area', 'city', 'navigate', 'navigation',
            'route', 'way', 'path', 'road', 'street', 'lane', 'avenue', 'nagar', 'salai',
            'landmark', 'near', 'nearby', 'opposite', 'beside', 'next to', 'across from',
            'pincode', 'zipcode', 'zip code', 'pin code', 'coordinates', 'gps',
            'google maps', 'apple maps', 'uber', 'ola', 'rapido', 'taxi', 'auto',
            'branch', 'outlet', 'spot', 'venue', 'site', 'campus', 'mall', 'plaza',
            'chennai', 'tamil', 'tamilnadu', 'south india', 'india'],
        stems: ['locat', 'address', 'direct', 'navig', 'reach', 'find']
    },
    contact: {
        phrases: ['how to contact', 'contact details', 'reach out to you',
            'get in touch', 'talk to someone', 'speak to manager', 'speak to staff',
            'customer care number', 'customer service number', 'helpline number',
            'what is your phone', 'what is your email', 'whats your number',
            'how can i reach', 'how can i contact', 'any complaints', 'file complaint'],
        words: ['contact', 'phone', 'call', 'number', 'email', 'reach', 'instagram',
            'social', 'whatsapp', 'message', 'dm', 'facebook', 'twitter', 'youtube',
            'website', 'helpline', 'support', 'customer', 'care', 'service',
            'mobile', 'telephone', 'landline', 'toll free', 'hotline', 'inbox',
            'enquiry', 'inquiry', 'feedback', 'suggestion', 'complaints', 'complaint',
            'telegram', 'snapchat', 'linkedin', 'tiktok', 'thread', 'threads'],
        stems: ['contact', 'reach', 'call', 'messag', 'inquir', 'complain', 'support']
    },
    menu: {
        phrases: ['what do you have', 'what do you serve', 'what food do you have',
            'what dishes do you have', 'what can i eat', 'what can i order',
            'show me menu', 'see the menu', 'view menu', 'full menu', 'complete menu',
            'whats available', 'what is available', 'all items', 'all dishes',
            'what types of food', 'types of cuisine', 'food options', 'dish list',
            'tell me about your menu', 'describe your menu', 'what cuisine',
            'todays special', 'daily special', 'chefs special', 'special of the day',
            'a la carte', 'set menu', 'buffet menu', 'prix fixe'],
        words: ['menu', 'food', 'dish', 'dishes', 'eat', 'serve', 'serving', 'offer',
            'cuisine', 'items', 'category', 'categories', 'variety', 'selection',
            'ordering', 'order', 'cooking', 'cook', 'prepare', 'preparation',
            'indian', 'chinese', 'continental', 'italian', 'mughlai', 'thai', 'arabic',
            'south indian', 'north indian', 'fusion', 'mediterranean', 'kerala',
            'street food', 'fast food', 'fine dining', 'buffet', 'thali', 'platter',
            'appetiser', 'starter', 'main', 'dessert', 'drink', 'side', 'combo',
            'veg', 'nonveg', 'vegetarian', 'meat', 'seafood'],
        stems: ['menu', 'food', 'dish', 'eat', 'serv', 'order', 'cuis', 'prepar', 'cook']
    },
    vegetarian: {
        phrases: ['any veg options', 'any vegetarian dishes', 'any veg food',
            'vegetarian menu', 'any plant based', 'purely vegetarian',
            'strictly vegetarian', 'no meat dishes', 'without meat', 'meat free',
            'any veg items', 'veg food available', 'is there veg food',
            'do you have veg', 'do you serve veg', 'no onion no garlic', 'jain food'],
        words: ['veg', 'vegetarian', 'vegan', 'plant', 'meatless', 'herbivore',
            'green', 'garden', 'sattvic', 'jain', 'niramish', 'shakahari',
            'paneer', 'tofu', 'soya', 'mushroom', 'cauliflower', 'palak', 'spinach',
            'broccoli', 'eggplant', 'aubergine', 'zucchini', 'squash', 'pumpkin',
            'rajma', 'chole', 'dal', 'lentil', 'chickpea', 'kidney bean', 'black bean',
            'legume', 'pulse', 'grain', 'wheat', 'rice', 'oat', 'quinoa',
            'veg biryani', 'veg thali', 'veg platter', 'veg curry', 'veg pizza',
            'veg burger', 'veg wrap', 'veg salad', 'veg soup', 'veg pasta'],
        stems: ['veg', 'veget', 'plant', 'herb', 'green', 'soya', 'mushroom']
    },
    nonveg: {
        phrases: ['any non veg options', 'any chicken dishes', 'do you serve chicken',
            'do you have fish', 'any seafood', 'meat dishes available',
            'non vegetarian menu', 'non veg food available', 'is there non veg',
            'do you serve meat', 'any mutton', 'any prawn', 'any crab'],
        words: ['nonveg', 'chicken', 'mutton', 'fish', 'prawn', 'seafood', 'meat',
            'egg', 'beef', 'pork', 'lamb', 'goat', 'crab', 'lobster', 'shrimp', 'squid',
            'octopus', 'oyster', 'clam', 'mussel', 'scallop', 'crayfish', 'turkey',
            'duck', 'quail', 'venison', 'rabbit', 'tuna', 'salmon', 'sardine', 'anchovy',
            'mackerel', 'hilsa', 'pomfret', 'rohu', 'catla', 'snapper', 'grouper',
            'barramundi', 'tilapia', 'trout', 'herring', 'cod', 'haddock', 'halibut',
            'swordfish', 'mahi', 'bass', 'sole', 'flounder', 'perch', 'pike', 'carp',
            'butter chicken', 'chicken tikka', 'chicken biryani', 'chicken curry',
            'fried chicken', 'grilled chicken', 'chicken masala', 'chicken gravy',
            'chicken 65', 'chicken lollipop', 'chicken kabab', 'chicken kebab',
            'mutton biryani', 'mutton curry', 'mutton masala', 'mutton korma',
            'fish fry', 'fish curry', 'fish masala', 'prawn masala', 'prawn biryani',
            'keema', 'mince', 'minced', 'kheema', 'nalli', 'bone'],
        stems: ['chicken', 'mutton', 'fish', 'prawn', 'seafood', 'meat', 'egg', 'nonveg']
    },
    popular: {
        phrases: ['what should i order', 'what do you recommend', 'any recommendations',
            'most ordered dish', 'your best dish', 'best selling dish',
            'what is good here', 'what is tasty', 'what is famous',
            'suggest something good', 'suggest a dish', 'suggest something to eat',
            'whats your specialty', 'your signature dish', 'house special',
            'what are your top dishes', 'which dish is the best',
            'should i try', 'must eat here', 'worth trying', 'worth ordering'],
        words: ['popular', 'best', 'recommended', 'famous', 'special', 'signature',
            'trending', 'favourite', 'favorite', 'bestseller', 'highlight', 'iconic',
            'legendary', 'classic', 'showstopper', 'chef', 'pick', 'choice', 'award',
            'top', 'premium', 'delicious', 'tasty', 'yummy', 'scrumptious', 'exquisite',
            'superb', 'mouthwatering', 'incredible', 'fantastic', 'amazing', 'exceptional',
            'outstanding', 'distinguished', 'renowned', 'celebrated', 'acclaimed',
            'crowd', 'pleaser', 'winner', 'hit', 'star', 'feature', 'headliner'],
        stems: ['popular', 'recommend', 'speciali', 'signatur', 'bestsell', 'trend']
    },
    starters: {
        phrases: ['what starters do you have', 'any starters', 'starter options',
            'show me starters', 'veg starters', 'non veg starters',
            'what appetizers do you have', 'finger food options',
            'what can i have before main course', 'before main course',
            'light food options', 'small plates'],
        words: ['starter', 'starters', 'appetizer', 'appetizers', 'snack', 'snacks',
            'fingerfood', 'finger food', 'small plate', 'small plates', 'tapas', 'mezze',
            'antipasto', 'crostini', 'bruschetta', 'nachos', 'wings', 'calamari',
            'tikka', 'kabab', 'kebab', 'pakoda', 'pakora', 'samosa', 'bhajia', 'bhaji',
            'vada', 'puri', 'chaat', 'bhel', 'pani puri', 'sev puri', 'dahi puri',
            'soup', 'salad', 'spring roll', 'egg roll', 'dumpling', 'dim sum', 'gyoza',
            'edamame', 'hummus', 'guacamole', 'salsa', 'dip', 'spread', 'pate',
            'carpaccio', 'tartare', 'bruschetta', 'crostini', 'rillette'],
        stems: ['starter', 'appetiz', 'snack', 'tikka', 'kabab', 'samosa', 'soup', 'salad']
    },
    mains: {
        phrases: ['what are your main courses', 'main course options', 'what for lunch',
            'what for dinner', 'main dish options', 'heavy food options', 'full meal',
            'i am hungry what should i eat', 'need something filling',
            'what biryani do you have', 'any good biryani', 'rice dishes',
            'curry options', 'gravy dishes'],
        words: ['main', 'mains', 'entree', 'course', 'lunch', 'dinner', 'supper',
            'heavy', 'filling', 'hearty', 'substantial', 'full', 'hungry', 'starving',
            'rice', 'biryani', 'pulao', 'pilaf', 'fried rice', 'khichdi', 'pongal',
            'curry', 'gravy', 'masala', 'korma', 'stew', 'ragout', 'casserole',
            'roti', 'chapati', 'naan', 'paratha', 'puri', 'dosa', 'idli', 'uttapam',
            'pizza', 'pasta', 'penne', 'spaghetti', 'fettuccine', 'linguine', 'tagliatelle',
            'risotto', 'polenta', 'gnocchi', 'lasagna', 'ravioli', 'tortellini',
            'burger', 'sandwich', 'wrap', 'burrito', 'quesadilla', 'taco', 'nachos',
            'noodles', 'lo mein', 'chow mein', 'pad thai', 'pho', 'ramen', 'udon',
            'dal', 'daal', 'sambhar', 'rasam', 'kootu', 'aviyal', 'olan', 'thoran',
            'sabzi', 'sabji', 'bhaji', 'bhujia', 'aloo', 'gobi', 'mattar', 'baingan',
            'paneer', 'tofu', 'soya', 'mushroom', 'jackfruit', 'banana flower',
            'tandoori', 'kebab', 'kabab', 'seekh', 'shami', 'galouti', 'shammi',
            'korma', 'roghan josh', 'nihari', 'haleem', 'keema', 'kofta'],
        stems: ['main', 'cours', 'lunch', 'dinner', 'rice', 'biryani', 'curry', 'roti', 'pasta', 'noodle', 'burger']
    },
    desserts: {
        phrases: ['what desserts do you have', 'any desserts', 'sweet options',
            'something sweet', 'end with something sweet', 'dessert menu',
            'after dinner sweet', 'any indian sweets', 'any mithai',
            'any ice cream', 'any gulab jamun', 'any chocolate dessert'],
        words: ['dessert', 'desserts', 'sweet', 'sweets', 'mithai', 'meetha',
            'gulab jamun', 'rasgulla', 'rasgola', 'rasmalai', 'kalakand', 'barfi',
            'ladoo', 'laddoo', 'halwa', 'kheer', 'payasam', 'payasama', 'phirni',
            'jalebi', 'imarti', 'shahi tukda', 'bread pudding', 'bread halwa',
            'sandesh', 'mishti', 'mishti doi', 'roshogolla', 'nolen gur', 'chomchom',
            'peda', 'modak', 'karanji', 'puran poli', 'khoa', 'mawa', 'basundi',
            'rabri', 'kulfi', 'lassi', 'shrikhand', 'amrakhand', 'shreekhand',
            'cake', 'pastry', 'tart', 'pie', 'flan', 'quiche', 'galette', 'clafoutis',
            'mousse', 'panna cotta', 'tiramisu', 'cheesecake', 'brownie', 'cookie',
            'muffin', 'cupcake', 'doughnut', 'donut', 'waffle', 'crepe', 'profiterole',
            'eclair', 'macaron', 'biscotti', 'biscuit', 'shortbread', 'scone',
            'ice cream', 'gelato', 'sorbet', 'sherbet', 'frozen yogurt', 'sundae',
            'milkshake', 'smoothie', 'parfait', 'banana split', 'affogato',
            'chocolate', 'vanilla', 'strawberry', 'caramel', 'butterscotch', 'mango',
            'pistacio', 'pistachio', 'saffron', 'rose', 'cardamom', 'cinnamon'],
        stems: ['dessert', 'sweet', 'cake', 'ice', 'gelato', 'pudding', 'chocolat', 'brownie']
    },
    drinks: {
        phrases: ['what drinks do you have', 'any drinks', 'beverage menu',
            'something to drink', 'cold drinks available', 'hot drinks available',
            'any juice', 'any mocktail', 'any fresh juice', 'any smoothie',
            'any coffee', 'what coffee do you serve', 'any tea', 'any lassi'],
        words: ['drink', 'drinks', 'beverage', 'beverages', 'juice', 'water', 'soda',
            'mocktail', 'cocktail', 'coffee', 'tea', 'milkshake', 'lassi', 'chai',
            'lemonade', 'limeade', 'cola', 'pop', 'fizzy', 'carbonated', 'sparkling',
            'nimbu pani', 'jaljeera', 'aam panna', 'rose milk', 'badam milk',
            'thandai', 'sharbat', 'sherbet', 'squash', 'cordial', 'syrup',
            'filter coffee', 'espresso', 'cappuccino', 'latte', 'mocha', 'americano',
            'flat white', 'macchiato', 'cortado', 'ristretto', 'lungo', 'drip coffee',
            'cold brew', 'nitro coffee', 'iced latte', 'cold coffee', 'frappe',
            'herbal tea', 'green tea', 'masala chai', 'ginger tea', 'elaichi chai',
            'oolong', 'black tea', 'white tea', 'chamomile', 'peppermint', 'hibiscus',
            'milk', 'buttermilk', 'chaas', 'curd', 'yogurt', 'kefir', 'kombucha',
            'coke', 'pepsi', 'sprite', 'fanta', 'limca', 'frooti', 'maaza', 'slice',
            '7up', 'thums up', 'mountain dew', 'mirinda', 'minute maid',
            'redbull', 'monster', 'sting', 'energy drink',
            'mineral water', 'sparkling water', 'tonic water', 'soda water',
            'coconut water', 'nariyal pani', 'sugarcane juice', 'ganne ka juice',
            'pomegranate juice', 'pineapple juice', 'watermelon juice', 'papaya juice',
            'orange juice', 'apple juice', 'grape juice', 'cranberry juice',
            'thirsty', 'hydrate', 'refresh', 'cool', 'chill', 'iced', 'chilled'],
        stems: ['drink', 'beverage', 'juice', 'water', 'coffee', 'tea', 'lassi', 'milkshake', 'smoothie', 'soda']
    },
    price: {
        phrases: ['how much does it cost', 'what is the price', 'how much is it',
            'price per person', 'price per head', 'cost per person', 'budget needed',
            'approximate cost', 'total bill estimate', 'bill amount estimate',
            'whats your price range', 'are you expensive', 'is it affordable',
            'value for money', 'cheap or expensive', 'cost of meal',
            'starting from how much', 'minimum price', 'maximum price',
            'how much is a meal', 'how much for two people', 'how much for a family'],
        words: ['price', 'prices', 'pricing', 'cost', 'rate', 'rates', 'expensive',
            'cheap', 'affordable', 'economical', 'budget', 'money', 'rupee', 'rs', 'inr',
            'value', 'worth', 'costly', 'reasonable', 'pocket', 'friendly', 'nominal',
            'minimum', 'maximum', 'average', 'per head', 'per person', 'per couple',
            'bill', 'amount', 'total', 'estimate', 'approximate', 'roughly',
            'splurge', 'luxury', 'premium', 'high end', 'mid range', 'budget friendly',
            'how much', 'spend', 'investment'],
        stems: ['price', 'cost', 'rate', 'expens', 'afford', 'budget', 'spend', 'cheap', 'rupee']
    },
    spicy: {
        phrases: ['how spicy is the food', 'can you make it less spicy',
            'can you reduce the spice', 'is the food spicy', 'very spicy food',
            'any mild food', 'any mild options', 'not too spicy please',
            'how much spice', 'do you have mild options', 'spicy or mild',
            'adjust the spice', 'spice level', 'reduce spice', 'increase spice'],
        words: ['spicy', 'spice', 'chilli', 'chili', 'pepper', 'chile',
            'jalapeno', 'habanero', 'serrano', 'cayenne', 'paprika',
            'fiery', 'scoville', 'tikha', 'tikhi', 'teekha', 'teekhi', 'mirchi',
            'jalfrezi', 'vindaloo', 'kolhapuri', 'chettinad', 'andhra',
            'extra spicy', 'very spicy', 'less spicy', 'non spicy'],
        stems: ['spic', 'chil', 'pepper', 'mirchi']
    },
    allergy: {
        phrases: ['i have an allergy', 'i am allergic', 'food allergy', 'any allergens',
            'is it gluten free', 'is it dairy free', 'do you have gluten free options',
            'nut allergy options', 'can i eat if i am diabetic', 'safe for celiac',
            'dietary restrictions', 'special dietary needs', 'health condition',
            'low calorie options', 'sugar free options', 'low sodium options',
            'do you have diabetic friendly food', 'safe for allergy person'],
        words: ['allergy', 'allergic', 'allergen', 'allergens', 'intolerance', 'celiac',
            'coeliac', 'gluten', 'lactose', 'dairy', 'nut', 'peanut', 'tree nut', 'soy',
            'wheat', 'egg allergy', 'shellfish', 'sulphite', 'sulphur', 'mustard',
            'sesame', 'lupin', 'mollusc', 'crustacean', 'fish allergy',
            'vegetarian', 'vegan', 'halal', 'kosher', 'jain',
            'diabetic', 'diabetes', 'sugar', 'sodium', 'salt', 'fat', 'cholesterol',
            'calorie', 'carb', 'carbohydrate', 'protein', 'fibre', 'fiber',
            'healthy', 'diet', 'restriction', 'special', 'need', 'condition',
            'pregnant', 'senior', 'elderly', 'infant', 'baby', 'child', 'toddler',
            'keto', 'paleo', 'atkins', 'low carb', 'low fat', 'low sugar', 'organic'],
        stems: ['allerg', 'intoleranc', 'gluten', 'lactos', 'dairy', 'vegan', 'celiac', 'diabet', 'diet']
    },
    payment: {
        phrases: ['how can i pay', 'what payment methods do you accept',
            'do you accept cards', 'can i pay by card', 'do you accept upi',
            'is gpay accepted', 'is paytm accepted', 'can i pay by cash',
            'is there any surcharge', 'split the bill', 'go dutch', 'separate bills',
            'any discount', 'any offers', 'any coupons', 'any vouchers'],
        words: ['payment', 'pay', 'cash', 'card', 'upi', 'gpay', 'googlepay', 'phonepay',
            'paytm', 'amazon pay', 'jio money', 'navi', 'cred', 'bhim',
            'credit card', 'debit card', 'visa', 'mastercard', 'amex', 'rupay',
            'contactless', 'tap to pay', 'nfc', 'wallet', 'ewallet', 'digital wallet',
            'net banking', 'internet banking', 'neft', 'rtgs', 'imps',
            'qr', 'qr code', 'scan', 'barcode', 'bank transfer', 'wire transfer',
            'emi', 'installment', 'no cost emi', 'zero interest',
            'discount', 'coupon', 'voucher', 'gift card', 'gift voucher',
            'loyalty', 'reward', 'points', 'cashback', 'offer', 'deal', 'promo',
            'zomato pay', 'swiggy pay', 'dunno pay'],
        stems: ['pay', 'payment', 'card', 'cash', 'upi', 'discount', 'coupon', 'offer', 'deal']
    },
    delivery: {
        phrases: ['do you deliver', 'do you do delivery', 'home delivery available',
            'can i order online', 'order for delivery', 'food delivery',
            'can i get food delivered', 'deliver to my location', 'deliver to my address',
            'how to order online', 'what is your delivery area', 'delivery charges',
            'delivery fee', 'minimum order for delivery', 'how long for delivery',
            'expected delivery time', 'estimated delivery time', 'is zomato available',
            'are you on swiggy', 'are you on zomato'],
        words: ['delivery', 'deliver', 'home delivery', 'takeaway', 'takeout', 'take out',
            'parcel', 'packing', 'packed', 'to go', 'carry out', 'pick up', 'pickup',
            'swiggy', 'zomato', 'dunzo', 'blinkit', 'zepto', 'bigbasket',
            'online order', 'online ordering', 'app', 'mobile app', 'website order',
            'food delivery', 'doorstep', 'doorstep delivery', 'contactless delivery',
            'express delivery', 'fast delivery', 'quick delivery', 'same day delivery'],
        stems: ['deliver', 'takeaway', 'parcel', 'pickup', 'swiggy', 'zomato', 'order']
    },
    events: {
        phrases: ['can i book for a birthday', 'planning a birthday party',
            'want to celebrate anniversary', 'corporate event booking',
            'private dining room', 'group booking', 'large party',
            'can you host events', 'do you host events', 'do you do events',
            'any party packages', 'wedding reception', 'baby shower booking',
            'farewell party', 'office party', 'team outing', 'college party',
            'kitty party', 'ladies meet', 'family function', 'get together party',
            'special occasion booking', 'celebrate at your restaurant'],
        words: ['event', 'events', 'birthday', 'anniversary', 'party', 'celebration',
            'occasion', 'private', 'corporate', 'office', 'team', 'group', 'gathering',
            'function', 'wedding', 'reception', 'engagement', 'shower', 'farewell',
            'reunion', 'retirement', 'promotion', 'graduation', 'convocation',
            'bachelorette', 'bachelor', 'stag', 'hen', 'bridal', 'mehndi', 'sangeet',
            'festive', 'festival', 'new year', 'christmas', 'diwali', 'eid', 'pongal',
            'onam', 'ugadi', 'holi', 'navratri', 'durga puja', 'ganesh chaturthi',
            'decorate', 'decoration', 'flowers', 'balloons', 'candles', 'streamers',
            'cake', 'custom cake', 'personalized', 'personalize', 'arrange', 'setup',
            'reservation group', 'table group', 'bulk booking', 'package', 'plan'],
        stems: ['event', 'birthday', 'annivers', 'parti', 'celebrat', 'wedding', 'function', 'group', 'booking']
    },
    booking: {
        phrases: ['i want to book a table', 'i want to reserve a table',
            'can i make a reservation', 'make a booking', 'table reservation',
            'i need a table', 'get a table', 'reserve a table for',
            'book a table for', 'planning a visit', 'i will come', 'i am coming',
            'i want to dine', 'i want to eat at your restaurant',
            'want to come for dinner', 'want to come for lunch',
            'seat availability', 'table availability', 'is table available',
            'do you have tables available', 'can we come', 'will you have space',
            'table for two', 'table for four', 'table for family',
            'how to book a table', 'how to reserve'],
        words: ['book', 'booking', 'reserve', 'reservation', 'table', 'seat', 'seats', 'slot',
            'appointment', 'dine in', 'walk in', 'dine', 'dining', 'sit', 'sitting',
            'visit', 'visit you', 'come', 'attend', 'arrival', 'arrive', 'guests',
            'coming', 'plan', 'planning', 'tonight', 'tomorrow', 'weekend', 'evening',
            'lunch', 'dinner', 'brunch', 'breakfast'],
        stems: ['book', 'reserv', 'seat', 'table', 'dine', 'visit', 'arriv', 'plan']
    },
    cancel: {
        phrases: ['cancel my reservation', 'cancel my booking', 'cancel my table',
            'how do i cancel', 'want to cancel my booking', 'need to cancel',
            'i need to postpone', 'reschedule my booking', 'change my booking',
            'change the date of booking', 'change the time of booking',
            'modify my reservation', 'can i get a refund', 'refund policy'],
        words: ['cancel', 'cancellation', 'cancellations', 'reschedule', 'postpone',
            'refund', 'modify', 'change', 'alteration', 'rebook', 'edit booking',
            'undo booking', 'delete booking', 'remove booking', 'abort'],
        stems: ['cancel', 'reschedul', 'postpon', 'refund', 'modif', 'chang']
    },
    parking: {
        phrases: ['is there parking available', 'do you have parking', 'where can i park',
            'is parking free', 'is parking paid', 'is there valet',
            'is there bike parking', 'two wheeler parking', 'car parking available',
            'how many cars can park', 'parking facility'],
        words: ['parking', 'park', 'car park', 'carpark', 'valet', 'garage', 'basement',
            'outdoor parking', 'open parking', 'covered parking', 'underground parking',
            'bike', 'motorbike', 'motorcycle', 'scooter', 'two wheeler', 'bicycle', 'cycle',
            'car', 'vehicle', 'auto', 'cab', 'rickshaw', 'tuk tuk'],
        stems: ['park', 'car', 'vehicl', 'bike', 'motor']
    },
    wifi: {
        phrases: ['do you have wifi', 'is wifi available', 'can i use the internet',
            'what is the wifi password', 'give me the wifi password',
            'is there internet connection', 'can i work from here', 'can i bring my laptop'],
        words: ['wifi', 'wi-fi', 'internet', 'network', 'connection', 'wireless', 'broadband',
            'hotspot', 'ssid', 'password', 'router', 'signal', 'bandwidth', 'browse',
            'streaming', 'work', 'remote work', 'laptop', 'tablet', 'device'],
        stems: ['wifi', 'internet', 'network', 'connect', 'password', 'wireles', 'browse']
    },
    about: {
        phrases: ['tell me about your restaurant', 'who are you', 'about your restaurant',
            'what is buggy foods', 'restaurant history', 'when did you start',
            'how long have you been open', 'how old is the restaurant',
            'who is the chef', 'who founded the restaurant', 'restaurant story',
            'your ambience', 'describe the atmosphere', 'how is the decor',
            'what type of restaurant', 'what kind of restaurant', 'fine dining or casual'],
        words: ['about', 'story', 'history', 'established', 'founded', 'background',
            'chef', 'head chef', 'sous chef', 'kitchen', 'team', 'staff', 'owner',
            'management', 'founder', 'brand', 'legacy', 'heritage', 'tradition',
            'experience', 'years', 'decade', 'since', 'award', 'accolade', 'recognition',
            'philosophy', 'values', 'mission', 'vision', 'culture', 'ethos',
            'ambience', 'atmosphere', 'decor', 'interior', 'design', 'aesthetic',
            'vibe', 'feel', 'mood', 'lighting', 'music', 'seating', 'capacity',
            'outdoor', 'indoor', 'terrace', 'rooftop', 'garden', 'view', 'courtyard'],
        stems: ['about', 'histori', 'found', 'chef', 'owner', 'brand', 'ambienc', 'atmospher', 'decor']
    },
    help: {
        phrases: ['what can you do', 'what can i ask you', 'how do i use this',
            'what are your capabilities', 'how does this work', 'what topics',
            'what questions can i ask', 'how can you help me', 'need assistance',
            'i am confused', 'not sure what to ask', 'show me options',
            'list your features', 'what do you know about'],
        words: ['help', 'assist', 'support', 'guide', 'options', 'faq', 'instructions',
            'manual', 'tutorial', 'explain', 'show', 'features', 'capabilities',
            'topics', 'commands', 'queries', 'questions', 'info', 'information',
            'confused', 'lost', 'stuck', 'unsure', 'unclear', 'dont know'],
        stems: ['help', 'assist', 'guid', 'support', 'instruct', 'explain', 'show']
    },
    thanks: {
        phrases: ['thank you so much', 'thanks a lot', 'many thanks', 'much appreciated',
            'that was helpful', 'very helpful', 'you helped me', 'good job',
            'well done', 'nice work', 'great job', 'that is all i need',
            'that is it', 'nothing else', 'no more questions', 'i am satisfied',
            'got what i needed', 'that answers my question', 'my doubt is cleared'],
        words: ['thank', 'thanks', 'appreciated', 'grateful', 'gratitude', 'superb', 'brilliant',
            'fantastic', 'amazing', 'wonderful', 'incredible', 'outstanding', 'excellent',
            'perfect', 'wonderful', 'lovely', 'great', 'nice', 'good', 'cool', 'awesome',
            'impressive', 'well done', 'good job', 'noted', 'understood', 'clear',
            'sorted', 'done', 'fine', 'alright', 'okay okay', 'very good'],
        stems: ['thank', 'appreciat', 'grateful', 'brillant', 'perfect', 'excellent']
    },
    bye: {
        phrases: ['good bye', 'see you later', 'see you soon', 'see you next time',
            'have a good day', 'have a nice day', 'take care of yourself',
            'until next time', 'i am done talking', 'no more questions',
            'thats all i needed', 'nothing more to ask', 'have a great evening',
            'good night everyone', 'looking forward to visit'],
        words: ['bye', 'goodbye', 'farewell', 'ciao', 'adios', 'adieu', 'tata', 'ta',
            'later', 'toodles', 'cheerio', 'cheers', 'tschüss', 'tchau',
            'done', 'finished', 'complete', 'exit', 'quit', 'close', 'leave',
            'enough', 'satisfied', 'happy'],
        stems: ['bye', 'goodby', 'farewell', 'done', 'finish', 'exit', 'quit', 'leav']
    },
}

// ── 6. NLP Scoring Engine ──────────────────────────────────────────
//   Returns the best-matched INTENTS object (with .response / .startBooking) or null
function detectIntent(rawText) {
    const normalised = normalise(rawText)
    const tokens = normalised.split(/\s+/).filter(t => t.length > 1)
    const stemmed = tokens.map(stem)

    const scores = {}

    for (const [intentName, bank] of Object.entries(INTENT_BANKS)) {
        let score = 0

        // A) Full/partial phrase match in normalised text (+3 per phrase hit)
        for (const ph of (bank.phrases || [])) {
            if (normalised.includes(ph)) score += 3
        }

        // B) Exact word/token match (+2 per match)
        for (const word of (bank.words || [])) {
            if (word.includes(' ')) {
                if (normalised.includes(word)) score += 2
            } else {
                if (tokens.includes(word)) score += 2
            }
        }

        // C) Stemmed token match (+2 per stem hit)
        for (const root of (bank.stems || [])) {
            if (stemmed.some(st => st.startsWith(root) || root.startsWith(st))) score += 2
        }

        // D) Fuzzy single-token match via Levenshtein (+1 per fuzzy hit)
        for (const tok of tokens) {
            if (tok.length < 3) continue
            let fuzzyHit = false
            for (const word of (bank.words || [])) {
                if (word.includes(' ')) continue
                const maxDist = tok.length <= 5 ? 1 : 2
                if (levenshtein(tok, word) <= maxDist) { fuzzyHit = true; break }
            }
            if (fuzzyHit) score += 1
        }

        if (score > 0) scores[intentName] = score
    }

    if (Object.keys(scores).length === 0) return null

    // Pick highest scoring intent (must score ≥ 2)
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
    if (best[1] < 3) return null

    // Return the matching INTENTS object so the route can call .response() and check .startBooking
    const name = best[0]
    return INTENTS.find(i => i.name === name) || null
}

// ── 7. Intent response map ─────────────────────────────────────────
//    Kept separate from the banks for clean code
const INTENTS = [

    {
        name: 'greeting',
        keywords: [
            'hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon',
            'namaste', 'howdy', 'greetings', 'good day', 'good night', 'hiya', 'heya',
            'hey there', 'hi there', 'hello there', 'sup', 'whats up', 'what is up',
            'how are you', 'how r u', 'how are u', 'how do you do', 'how is it going',
            'is anyone there', 'anyone home', 'anybody there', 'start', 'begin', 'start chat',
            'open', 'test', 'testing', 'ping', 'helo', 'hii', 'hiii', 'haai', 'hai',
            'vanakkam', 'namaskaram', 'namasthe', 'welcome', 'good to see you',
        ],
        response: () => `👋 Welcome to **${INFO.name}**! I'm your AI dining assistant.\n\nI can help you with:\n• 🍽️ Menu & dish info\n• 📅 Table reservations\n• ⏰ Opening hours\n• 📍 Location & contact\n• 🌟 Popular dishes\n• 💰 Pricing info\n\nWhat can I help you with today?`
    },
    {
        name: 'hours',
        keywords: [
            'hours', 'hour', 'open', 'opening', 'timing', 'timings', 'close', 'closing',
            'time', 'when', 'schedule', 'available', 'availability', 'what time',
            'are you open', 'when do you open', 'when do you close', 'open today',
            'what are your hours', 'working hours', 'business hours', 'operation hours',
            'open now', 'currently open', 'open on sunday', 'open on weekend',
            'open on monday', 'open on tuesday', 'open on saturday',
            'close time', 'closing time', 'last order', 'last entry', 'kitchen closes',
            'till what time', 'how late', 'how early', 'from when', 'until when',
            'lunch time', 'dinner time', 'breakfast time', 'brunch',
            'holiday hours', 'weekend hours', 'open on holiday',
        ],
        response: () => `⏰ **${INFO.name} Opening Hours**\n\n🗓️ ${INFO.hours}\n\nWe are open **7 days a week** — including weekends and holidays!\n\n💡 We recommend booking in advance for weekends (especially Fri–Sun evenings) as we fill up fast.\n\nWant to reserve a table? Just say *"book a table"*!`
    },
    {
        name: 'location',
        keywords: [
            'location', 'address', 'where', 'find', 'direction', 'directions', 'map',
            'place', 'situated', 'located', 'area', 'city', 'navigate', 'navigation',
            'how to reach', 'how to get there', 'how to come', 'how to find',
            'show me the way', 'google maps', 'uber', 'ola', 'taxi',
            'landmark', 'near', 'nearby', 'opposite', 'next to', 'beside',
            'which road', 'which street', 'pin code', 'pincode', 'zip code',
            'chennai', 'tamil nadu', 'south india',
            'branch', 'branches', 'outlet', 'outlets', 'restaurant location',
        ],
        response: () => `📍 **Find Us**\n\n🏠 ${INFO.address}\n\n📞 Call us: ${INFO.phone}\n📧 Email: ${INFO.email}\n📸 Instagram: ${INFO.instagram}\n\nWe're easy to find and have parking available. Need directions? Visit our Contact page for the full address & map!`
    },
    {
        name: 'contact',
        keywords: [
            'contact', 'phone', 'call', 'number', 'email', 'reach', 'instagram',
            'social', 'whatsapp', 'message', 'dm', 'direct message', 'facebook',
            'twitter', 'youtube', 'website', 'official', 'helpline', 'support',
            'customer care', 'customer service', 'get in touch', 'reach out',
            'talk to someone', 'speak to manager', 'speak to staff', 'complaints',
            'feedback', 'suggestion', 'how to contact', 'contact details',
            'mobile number', 'telephone', 'landline', 'toll free',
        ],
        response: () => `📞 **Contact ${INFO.name}**\n\n📱 Phone: ${INFO.phone}\n📧 Email: ${INFO.email}\n📸 Instagram: ${INFO.instagram}\n📍 Address: ${INFO.address}\n\nOur team is available during opening hours (${INFO.hours}). Feel free to reach out!`
    },
    {
        name: 'menu',
        keywords: [
            'menu', 'food', 'dish', 'dishes', 'eat', 'serve', 'serving', 'offer',
            'cuisine', 'items', 'what do you have', 'what do you serve', 'category',
            'categories', 'what food', 'what dishes', 'food list', 'food menu',
            'what can i eat', 'what can i order', 'ordering', 'order', 'show me menu',
            'see menu', 'view menu', 'full menu', 'complete menu', 'all items',
            'all dishes', 'all food', 'what is available', 'whats available',
            'what are your dishes', 'what types of food', 'types of cuisine',
            'indian food', 'chinese food', 'continental', 'italian', 'mughlai',
            'south indian', 'north indian', 'fusion', 'thai', 'mediterranean',
            'street food', 'fast food', 'fine dining', 'buffet', 'thali', 'set menu',
            'a la carte', 'chef special', 'todays special', 'daily special',
        ],
        response: async () => {
            const counts = await MenuItem.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])
            const lines = counts.map(c => `• **${c._id}** — ${c.count} dishes`).join('\n')
            return `🍽️ **Our Menu**\n\n${lines || '• Starters  • Mains  • Desserts  • Drinks'}\n\n✅ We have both **Veg** 🥗 and **Non-Veg** 🍗 options.\n\nVisit our **Menu page** to browse all dishes with photos & prices. Want to know our popular picks? Just ask! 🌟`
        }
    },
    {
        name: 'vegetarian',
        keywords: ['veg', 'vegetarian', 'vegan', 'plant', 'no meat', 'meat free', 'meatless'],
        response: async () => {
            const count = await MenuItem.countDocuments({ isVeg: true })
            const items = await MenuItem.find({ isVeg: true }).limit(4).select('name category price')
            const list = items.map(i => `• ${i.name} (${i.category}) — ₹${i.price}`).join('\n')
            return `🥗 **Vegetarian Options**\n\nWe have **${count} vegetarian dishes** on our menu!\n\n🌟 Some highlights:\n${list}\n\nAll our dishes are clearly marked with 🟢 Veg / 🔴 Non-Veg on the menu page. We also cater to specific dietary needs — just mention it when booking!`
        }
    },
    {
        name: 'nonveg',
        keywords: ['non veg', 'nonveg', 'non-veg', 'chicken', 'mutton', 'fish', 'prawn', 'seafood', 'meat', 'egg', 'beef', 'pork'],
        response: async () => {
            const count = await MenuItem.countDocuments({ isVeg: false })
            const items = await MenuItem.find({ isVeg: false }).limit(4).select('name category price')
            const list = items.map(i => `• ${i.name} (${i.category}) — ₹${i.price}`).join('\n')
            return `🍗 **Non-Vegetarian Options**\n\nWe have **${count} non-veg dishes** for you!\n\n🌟 Popular choices:\n${list}\n\nHead to our Menu page to see all options with full details and photos!`
        }
    },
    {
        name: 'vegetarian',
        keywords: [
            'veg', 'vegetarian', 'vegan', 'plant', 'no meat', 'meat free', 'meatless',
            'pure veg', 'only veg', 'strictly vegetarian', 'veg food', 'veg options',
            'veg dishes', 'veg items', 'veg menu', 'what veg', 'any veg', 'have veg',
            'without meat', 'no chicken', 'no fish', 'no egg', 'green', 'healthy',
            'plant based', 'herbivore', 'veg thali', 'veg special', 'veg platter',
            'paneer', 'tofu', 'dal', 'lentil', 'rajma', 'chole', 'veg biryani',
            'mushroom', 'cauliflower', 'palak', 'spinach', 'mixed veg', 'veg curry',
            'sattvic', 'jain food', 'no onion', 'no garlic',
        ],
        response: async () => {
            const count = await MenuItem.countDocuments({ isVeg: true })
            const items = await MenuItem.find({ isVeg: true }).limit(4).select('name category price')
            const list = items.map(i => `• ${i.name} (${i.category}) — ₹${i.price}`).join('\n')
            return `🥗 **Vegetarian Options**\n\nWe have **${count} vegetarian dishes** on our menu!\n\n🌟 Some highlights:\n${list || 'Visit our menu page to explore all veg options!'}\n\nAll dishes clearly marked 🟢 Veg / 🔴 Non-Veg. We also cater to Jain / no-onion-garlic requirements — mention it when booking!`
        }
    },
    {
        name: 'nonveg',
        keywords: [
            'non veg', 'nonveg', 'non-veg', 'chicken', 'mutton', 'fish', 'prawn', 'seafood',
            'meat', 'egg', 'beef', 'pork', 'lamb', 'goat', 'crab', 'lobster', 'shrimp',
            'turkey', 'duck', 'quail', 'venison', 'tuna', 'salmon', 'sardine', 'anchovy',
            'chicken curry', 'chicken biryani', 'butter chicken', 'chicken tikka',
            'grilled chicken', 'fried chicken', 'fish fry', 'fish curry', 'prawn masala',
            'mutton biryani', 'mutton curry', 'keema', 'egg curry', 'egg rice',
            'non veg thali', 'meat dishes', 'non veg options', 'non veg menu',
            'non veg items', 'have chicken', 'serve chicken', 'any chicken',
        ],
        response: async () => {
            const count = await MenuItem.countDocuments({ isVeg: false })
            const items = await MenuItem.find({ isVeg: false }).limit(4).select('name category price')
            const list = items.map(i => `• ${i.name} (${i.category}) — ₹${i.price}`).join('\n')
            return `🍗 **Non-Vegetarian Options**\n\nWe have **${count} non-veg dishes** for you!\n\n🌟 Popular choices:\n${list || 'Visit our menu page to see all non-veg options!'}\n\nAll our meats are fresh and sourced from trusted suppliers. Head to the Menu page to browse everything!`
        }
    },
    {
        name: 'popular',
        keywords: [
            'popular', 'best', 'recommended', 'famous', 'special', 'must try', 'must-try',
            'top', 'favourite', 'favorite', 'trending', 'signature', 'most ordered',
            'best seller', 'bestseller', 'top selling', 'crowd favourite', 'crowd pleaser',
            'chef recommendation', 'chef pick', 'chef choice', 'house special', 'house specialty',
            'what should i order', 'what to order', 'suggest something', 'suggestion',
            'what is good', 'what is nice', 'what is tasty', 'what is delicious',
            'what do you recommend', 'recommend something', 'any recommendations',
            'star dish', 'star item', 'iconic', 'classic', 'legendary', 'award winning',
            'highlight', 'highlights', 'showstopper', 'must have', 'must eat',
        ],
        response: async () => {
            const items = await MenuItem.find({ featured: true }).limit(5).select('name category price isVeg')
            if (!items.length) return `🌟 **Chef's Picks**\n\nAll our dishes are crafted with equal love! Visit the Menu page to discover 100+ dishes.`
            const list = items.map(i => `• ${i.isVeg ? '🟢' : '🔴'} **${i.name}** (${i.category}) — ₹${i.price}`).join('\n')
            return `🌟 **Most Popular Dishes**\n\n${list}\n\nAll these are chef-crafted with premium ingredients. A true **Buggy Foods** experience! 🍴`
        }
    },
    {
        name: 'starters',
        keywords: [
            'starter', 'starters', 'appetizer', 'appetizers', 'snack', 'snacks',
            'beginning', 'start', 'before meal', 'pre meal', 'finger food', 'side dish',
            'fried snack', 'fry', 'tikka', 'kabab', 'kebab', 'pakoda', 'pakora', 'samosa',
            'soup', 'salad', 'chaat', 'pani puri', 'bhel', 'spring roll', 'bruschetta',
            'nachos', 'wings', 'calamari', 'crostini', 'antipasto', 'mezze',
            'veg starter', 'non veg starter', 'starter menu', 'starter options',
        ],
        response: async () => {
            const items = await MenuItem.find({ category: 'Starters' }).limit(5).select('name price isVeg')
            const list = items.map(i => `• ${i.isVeg ? '🟢' : '🔴'} ${i.name} — ₹${i.price}`).join('\n')
            return `🥗 **Starters**\n\n${list || 'We have a variety of starters — visit the menu page to explore!'}\n\nPerfect to share or enjoy before the main course! 🍴`
        }
    },
    {
        name: 'mains',
        keywords: [
            'main', 'mains', 'main course', 'entree', 'primary', 'lunch', 'dinner',
            'rice', 'biryani', 'curry', 'roti', 'naan', 'chapati', 'paratha', 'tandoori',
            'dal makhani', 'dal fry', 'paneer butter masala', 'palak paneer',
            'fried rice', 'noodles', 'pasta', 'pizza', 'burger', 'wrap', 'quesadilla',
            'korma', 'masala', 'gravy', 'sabzi', 'sabji', 'main dish', 'main food',
            'what for lunch', 'what for dinner', 'full meal', 'heavy meal', 'hungry',
            'i am hungry', 'really hungry', 'starving', 'need food', 'want food',
        ],
        response: async () => {
            const items = await MenuItem.find({ category: 'Mains' }).limit(5).select('name price isVeg')
            const list = items.map(i => `• ${i.isVeg ? '🟢' : '🔴'} ${i.name} — ₹${i.price}`).join('\n')
            return `🍛 **Main Course**\n\n${list || 'We have a rich selection of mains — visit the menu page to see all!'}\n\nHearty, flavourful, and crafted by our award-winning kitchen team! 🍴`
        }
    },
    {
        name: 'desserts',
        keywords: [
            'dessert', 'desserts', 'sweet', 'sweets', 'cake', 'ice cream', 'pudding',
            'after dinner', 'mithai', 'gulab jamun', 'rasgulla', 'kheer', 'halwa',
            'ladoo', 'barfi', 'jalebi', 'payasam', 'peda', 'sandesh', 'mishti doi',
            'chocolate lava', 'brownie', 'cookie', 'pastry', 'tart', 'mousse', 'panna cotta',
            'crème brûlée', 'cheesecake', 'tiramisu', 'gelato', 'sorbet', 'waffle',
            'doughnut', 'donut', 'muffin', 'cupcake', 'something sweet', 'end with',
            'after food', 'after meal', 'post meal', 'sweet dish', 'sweet options',
        ],
        response: async () => {
            const items = await MenuItem.find({ category: 'Desserts' }).limit(5).select('name price isVeg')
            const list = items.map(i => `• ${i.isVeg ? '🟢' : '🔴'} ${i.name} — ₹${i.price}`).join('\n')
            return `🍮 **Desserts**\n\n${list || 'We have a range of indulgent desserts — explore the menu!'}\n\nEnd your meal on a sweet note! 🍰`
        }
    },
    {
        name: 'drinks',
        keywords: [
            'drink', 'drinks', 'beverage', 'beverages', 'juice', 'water', 'soda',
            'mocktail', 'cocktail', 'coffee', 'tea', 'milkshake', 'lassi', 'chai',
            'lemonade', 'limeade', 'cold drink', 'hot drink', 'fresh juice', 'cold coffee',
            'iced tea', 'smoothie', 'nimbu pani', 'jaljeera', 'aam panna', 'rose milk',
            'filter coffee', 'espresso', 'cappuccino', 'latte', 'mocha', 'americano',
            'herbal tea', 'green tea', 'masala chai', 'ginger tea', 'milk', 'buttermilk',
            'chaas', 'coke', 'pepsi', 'fanta', 'sprite', '7up', 'thums up',
            'mineral water', 'sparkling water', 'tonic water', 'energy drink',
            'thirsty', 'im thirsty', 'something to drink', 'refreshing', 'cool drink',
        ],
        response: async () => {
            const items = await MenuItem.find({ category: 'Drinks' }).limit(5).select('name price')
            const list = items.map(i => `• 🟢 ${i.name} — ₹${i.price}`).join('\n')
            return `🥤 **Drinks & Beverages**\n\n${list || 'We offer a range of refreshing drinks — explore the menu!'}\n\nFrom fresh juices to premium mocktails — something for everyone! 🍹`
        }
    },
    {
        name: 'price',
        keywords: [
            'price', 'prices', 'pricing', 'cost', 'how much', 'rate', 'rates', 'expensive',
            'cheap', 'affordable', 'budget', 'spend', 'rupee', 'inr', 'rs', 'money',
            'value', 'worth', 'costly', 'reasonable', 'economical', 'pocket friendly',
            'what does it cost', 'what is the price', 'price list', 'pricing list',
            'how much does it cost', 'how much is', 'price range', 'starting price',
            'minimum price', 'maximum price', 'average price', 'price per head',
            'per person cost', 'total bill', 'bill amount', 'approximate cost',
            'expensive or cheap', 'is it expensive', 'is it cheap', 'value for money',
        ],
        response: async () => {
            const agg = await MenuItem.aggregate([
                { $group: { _id: '$category', min: { $min: '$price' }, max: { $max: '$price' }, avg: { $avg: '$price' } } },
                { $sort: { _id: 1 } }
            ])
            const lines = agg.map(c => `• **${c._id}**: ₹${c.min} – ₹${c.max} (avg ₹${Math.round(c.avg)})`).join('\n')
            return `💰 **Price Range**\n\n${lines || '• Starters: ₹80–₹300\n• Mains: ₹150–₹600\n• Desserts: ₹80–₹250\n• Drinks: ₹50–₹200'}\n\n✅ We offer great value for a fine dining experience!\nFamily deals and combos available — ask your server or call us!`
        }
    },
    {
        name: 'spicy',
        keywords: [
            'spicy', 'spice', 'hot', 'chilli', 'chili', 'pepper', 'spiciness', 'spice level',
            'very spicy', 'too spicy', 'mild', 'not spicy', 'less spicy', 'extra spicy',
            'spicy food', 'any spicy dish', 'hot food', 'how spicy', 'can i adjust spice',
            'can you make it less spicy', 'reduce spice', 'increase spice',
            'medium spicy', 'tangy', 'pungent', 'fiery', 'peppery',
        ],
        response: () => `🌶️ **Spice Levels at Buggy Foods**\n\nOur dishes come in 3 spice levels:\n• 🟢 **Mild** — Suitable for all ages\n• 🟡 **Medium** — A gentle kick\n• 🔴 **Very Spicy** — For spice lovers!\n\nYou can always ask your server to **adjust the spice level** — our chefs are happy to customise!`
    },
    {
        name: 'allergy',
        keywords: [
            'allergy', 'allergic', 'allergen', 'allergens', 'intolerance', 'gluten',
            'lactose', 'dairy free', 'gluten free', 'nut allergy', 'peanut allergy',
            'tree nut', 'shellfish allergy', 'wheat', 'soy', 'sulphite', 'egg allergy',
            'celiac', 'coeliac', 'dietary restriction', 'dietary need', 'special diet',
            'diabetic', 'diabetes', 'sugar free', 'low sodium', 'low calorie',
            'can i eat if', 'safe for allergy', 'is it safe', 'health condition',
        ],
        response: () => `⚕️ **Allergies & Dietary Needs**\n\nYour health is our top priority! Please inform us of any allergies or dietary requirements when:\n• 📅 Making a booking\n• 🗣️ Speaking to your server on arrival\n\nWe handle common requirements:\n• 🌾 Gluten-sensitive options available\n• 🥛 Dairy-free on request\n• 🥜 Nut-free preparations on request\n\n⚠️ Please note our kitchen handles all ingredients, so cross-contamination risk exists. Call us at ${INFO.phone} for specific allergy concerns.`
    },
    {
        name: 'payment',
        keywords: [
            'payment', 'pay', 'cash', 'card', 'upi', 'gpay', 'google pay', 'phonepay', 'paytm',
            'credit card', 'debit card', 'visa', 'mastercard', 'rupay', 'net banking',
            'how to pay', 'payment method', 'payment options', 'do you accept card',
            'is card accepted', 'cashless', 'digital payment', 'online payment',
            'qr code', 'scan and pay', 'split bill', 'split the bill', 'dutch', 'go dutch',
        ],
        response: () => `💳 **Payment Options**\n\nWe accept all major payment methods:\n
• 💵 Cash\n• 💳 Credit / Debit Cards (Visa, Mastercard, RuPay)\n• 📱 UPI — GPay, PhonePe, Paytm\n• 🔗 Net Banking\n\nWe also support **split billing** for groups. Our team will be happy to assist!`
    },
    {
        name: 'delivery',
        keywords: [
            'delivery', 'deliver', 'home delivery', 'order online', 'takeaway', 'take away',
            'takeout', 'take out', 'parcel', 'pack', 'to go', 'carry out', 'swiggy', 'zomato',
            'food delivery', 'online order', 'order from home', 'door delivery',
            'can i order online', 'do you deliver', 'do you do delivery',
        ],
        response: () => `🚚 **Delivery & Takeaway**\n\nYes! You can order from us via:\n• 🛵 **Swiggy** — Search "Buggy Foods"
• 🛴 **Zomato** — Search "Buggy Foods"\n\nFor **takeaways**, call us at ${INFO.phone} and we'll have it ready for pickup.\n\n⏱️ Average delivery time: 30–45 mins depending on your location.`
    },
    {
        name: 'events',
        keywords: [
            'event', 'events', 'birthday', 'anniversary', 'party', 'celebration', 'occasion',
            'private dining', 'private event', 'corporate', 'corporate event', 'team lunch',
            'bulk booking', 'group booking', 'large group', 'gathering', 'get together',
            'function', 'wedding', 'reception', 'engagement', 'baby shower', 'farewell',
            'office party', 'family event', 'special occasion', 'customise', 'decorate',
            'can you decorate', 'flower arrangement', 'cake', 'surprise', 'special arrangement',
        ],
        response: () => `🎉 **Private Events & Celebrations**\n\nWe love hosting special occasions! We offer:\n• 🎂 Birthday & Anniversary packages\n• 🏢 Corporate dining & team lunches\n• 👨‍👩‍👧 Family get-togethers & reunions\n• 💍 Pre-wedding dinners & engagements\n\n✅ Private dining area available (up to 30 guests)\n✅ Custom decorations & cakes on request\n\nCall us at ${INFO.phone} or email ${INFO.email} to plan your event!`
    },
    {
        name: 'booking',
        keywords: [
            'book', 'booking', 'reserve', 'reservation', 'table', 'seat', 'seats', 'slot',
            'appointment', 'dine in', 'walk in', 'i want to book', 'i want to reserve',
            'can i book', 'can i reserve', 'make a reservation', 'make a booking',
            'need a table', 'get a table', 'table for', 'reserve a table for',
            'book a table for', 'i would like to book', 'i want a table',
            'sit in', 'dine with you', 'eat with you', 'come to your restaurant',
            'plan a visit', 'planning a visit', 'visit your restaurant',
        ],
        response: () => `📅 **Table Reservation**\n\nI'd be happy to book a table for you! Let's get started.\n\nHow many guests will be joining?`,
        startBooking: true
    },
    {
        name: 'cancel',
        keywords: [
            'cancel', 'cancellation', 'cancel booking', 'cancel reservation', 'refund',
            'cancel my table', 'i want to cancel', 'how to cancel', 'cancel order',
            'cancel appointment', 'postpone', 'reschedule', 'change booking',
            'change date', 'change time', 'modify reservation', 'modify booking',
        ],
        response: () => `❌ **Cancellations & Changes**\n\nTo cancel or modify a reservation, please contact us directly:\n\n📞 ${INFO.phone}\n📧 ${INFO.email}\n\nWe appreciate at least **2 hours notice** for cancellations. Thank you! 🙏`
    },
    {
        name: 'parking',
        keywords: [
            'park', 'parking', 'car', 'vehicle', 'bike', 'motorbike', 'two wheeler',
            'four wheeler', 'park my car', 'is there parking', 'do you have parking',
            'where to park', 'car park', 'valet', 'valet parking', 'basement parking',
            'free parking', 'paid parking', 'bike stand', 'cycle stand',
        ],
        response: () => `🚗 **Parking**\n\nYes! We have **free parking** for all guests.\n\n🅿️ Parking is available right next to the restaurant.\n🏍️ Two-wheeler parking also available.\n\nFor large groups, call us at ${INFO.phone} in advance.`
    },
    {
        name: 'wifi',
        keywords: [
            'wifi', 'wi-fi', 'internet', 'network', 'password', 'connect',
            'wireless', 'broadband', 'hotspot', 'free wifi', 'do you have wifi',
            'is wifi available', 'wifi password', 'network password', 'ssid',
            'online', 'browse', 'work from restaurant', 'laptop',
        ],
        response: () => `📶 **WiFi**\n\nYes! We offer **free WiFi** to all guests. 😊\n\nAsk your server for the password when seated. Enjoy browsing while you dine!`
    },
    {
        name: 'about',
        keywords: [
            'about', 'story', 'history', 'established', 'founded', 'who are you',
            'tell me about', 'background', 'chef', 'head chef', 'kitchen team',
            'who owns', 'owner', 'management', 'brand', 'legacy', 'heritage',
            'experience', 'years of experience', 'awards', 'accolades', 'recognition',
            'philosophy', 'values', 'mission', 'vision', 'culture', 'ambience',
            'atmosphere', 'decor', 'interior', 'vibe', 'feel', 'how is the place',
        ],
        response: () => `🍴 **About ${INFO.name}**\n\n${INFO.name} is a premium fine dining restaurant in **${INFO.address}**.\n\nWe are known for:\n• 🌟 Award-winning chefs & signature dishes\n• 🥗 Extensive menu with both Veg & Non-Veg options\n• 🏆 Consistently high guest satisfaction\n• 👥 Welcoming thousands of happy diners\n• 🎉 Private events, birthdays & corporate dining\n\n*"A celebration of flavour, artistry, and tradition."*\n\nOpen: ${INFO.hours}\nReach us: ${INFO.phone} | ${INFO.email}`
    },
    {
        name: 'help',
        keywords: [
            'help', 'assist', 'support', 'what can you do', 'what do you know',
            'options', 'guide', 'faq', 'commands', 'features', 'how does this work',
            'what can i ask', 'how to use', 'instructions', 'capabilities',
            'what are your capabilities', 'what questions can i ask',
            'i need help', 'need assistance', 'confused', 'lost', 'not sure',
        ],
        response: () => `🤖 **I can help you with:**\n\n• 🍽️ **Menu info** — "What starters do you have?"\n• 🌟 **Popular dishes** — "What's your best dish?"\n• 💰 **Prices** — "How much does a main cost?"\n• ⏰ **Hours** — "When do you open?"\n• 📍 **Location** — "Where are you located?"\n• 📞 **Contact** — "What's your phone number?"\n• 📅 **Book a table** — "Reserve a table for 2"\n• 🥗 **Veg options** — "Any vegetarian dishes?"\n• 🍗 **Non-veg** — "Do you serve chicken?"\n• 🌶️ **Spice levels** — "How spicy is the food?"\n• 🚚 **Delivery** — "Do you deliver?"\n• 🎉 **Events** — "Do you host birthday parties?"\n\nJust type naturally — I understand! 😊`
    },
    {
        name: 'thanks',
        keywords: [
            'thank', 'thanks', 'thank you', 'thankyou', 'great', 'awesome', 'perfect',
            'wonderful', 'nice', 'good', 'excellent', 'brilliant', 'fantastic', 'superb',
            'amazing', 'love it', 'love this', 'impressive', 'well done', 'good job',
            'very helpful', 'so helpful', 'appreciate', 'appreciated', 'grateful',
            'okk thank you', 'ok thanks', 'alright thanks', 'thats all',
            'thats it', 'got it', 'understood', 'clear', 'makes sense',
        ],
        response: () => `😊 You're most welcome! It's our pleasure to help.\n\nIs there anything else I can assist with? Feel free to ask about our **menu, hours, location**, or to **book a table**! 🍴✨`
    },
    {
        name: 'bye',
        keywords: [
            'bye', 'goodbye', 'see you', 'later', 'good night', 'goodnight', 'take care',
            'cya', 'see ya', 'farewell', 'ta ta', 'tata', 'adios', 'au revoir',
            'until next time', 'i am done', 'im done', 'no more questions', 'all done',
            'thats all i needed', 'nothing else', 'no need', 'i am good', 'im good',
            'have a good day', 'have a nice day', 'have a great day',
        ],
        response: () => `👋 Goodbye! We hope to see you at **${INFO.name}** very soon.\n\nHave a wonderful day! 🍴✨`
    },
]


// ── Response functions for each intent ───────────────────────────
// ── Booking slot collection ───────────────────────────────────────
const BOOKING_SLOTS = ['guests', 'date', 'time', 'name', 'phone', 'email']
const BOOKING_PROMPTS = {
    guests: '👥 How many guests will be joining? (1–20)',
    date: '📅 What date? (e.g. "this Saturday", "tomorrow", "2026-03-10")',
    time: '🕐 What time? (e.g. "7:30 pm", "8 pm", "19:00")',
    name: '👤 Your name for the reservation?',
    phone: '📱 Your 10-digit mobile number?',
    email: '📧 And your email address?',
}

function extractBookingSlots(text, prev = {}) {
    const s = { ...prev }
    const now = new Date()

    if (!s.guests) {
        const m = text.match(/\b(?:for\s+)?(\d+)\s*(?:guests?|people|persons?|pax)?\b/i)
        if (m && +m[1] >= 1 && +m[1] <= 20) s.guests = +m[1]
    }
    if (!s.date) {
        const t = text.toLowerCase()
        const next = (day) => { const d = new Date(now); d.setDate(d.getDate() + ((day - d.getDay() + 7) % 7 || 7)); return d.toISOString().split('T')[0] }
        if (/\btoday\b/.test(t)) s.date = now.toISOString().split('T')[0]
        else if (/\btomorrow\b/.test(t)) { const d = new Date(now); d.setDate(d.getDate() + 1); s.date = d.toISOString().split('T')[0] }
        else if (/\bmonday\b/.test(t)) s.date = next(1)
        else if (/\btuesday\b/.test(t)) s.date = next(2)
        else if (/\bwednesday\b/.test(t)) s.date = next(3)
        else if (/\bthursday\b/.test(t)) s.date = next(4)
        else if (/\bfriday\b/.test(t)) s.date = next(5)
        else if (/\bsaturday\b/.test(t)) s.date = next(6)
        else if (/\bsunday\b/.test(t)) s.date = next(0)
        else { const m = text.match(/\b(\d{4}-\d{2}-\d{2})\b/); if (m) s.date = m[1] }
    }
    if (!s.time) {
        const m = text.match(/\b(\d{1,2})[:\.]?(\d{0,2})\s*(am|pm)\b/i) || text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)
        if (m) {
            let h = +m[1], mn = m[2] ? m[2].padEnd(2, '0') : '00'
            if (m[3] && /pm/i.test(m[3]) && h < 12) h += 12
            if (m[3] && /am/i.test(m[3]) && h === 12) h = 0
            s.time = `${String(h).padStart(2, '0')}:${mn}`
        }
    }
    if (!s.name) {
        const m = text.match(/(?:(?:my\s+)?name\s+is|i'?m|i\s+am)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i) || text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$/)
        if (m) s.name = m[1].trim()
    }
    if (!s.phone) { const m = text.match(/\b([6-9]\d{9})\b/); if (m) s.phone = m[1] }
    if (!s.email) { const m = text.match(/[\w.+\-]+@[\w\-]+\.\w+/); if (m) s.email = m[0].toLowerCase() }
    return s
}



/* ── Main chat route ────────────────────────────────────────────── */
router.post('/chat/message', async (req, res) => {
    try {
        const { message = '', session = {} } = req.body
        const text = message.trim()
        if (!text) return res.json({ success: true, reply: "Hi! How can I help you today? 😊", session, done: false })

        // ── 1. LLM OVERRIDE (Google Gemini) ────────────────────────
        if (isLLMConfigured()) {
            const sessionId = session._id || req.ip || 'guest'
            try {
                const llmResult = await handleLLMChat(sessionId, text)
                return res.json({ ...llmResult, session: { ...session, _id: sessionId } })
            } catch (err) {
                console.error('[LLM Fallback]', err)
                // If Gemini fails, we fall through to the NLP engine
            }
        }

        // ── Reset ──────────────────────────────────────────────────
        if (/\b(reset|start over|cancel|restart|new booking)\b/i.test(text)) {
            return res.json({ success: true, reply: "Sure! Starting fresh. 😊 How can I help you?", session: {}, done: false })
        }

        // ── BOOKING MODE: if we're already collecting slots ────────
        if (session._mode === 'booking') {
            const slots = extractBookingSlots(text, session)
            const missing = BOOKING_SLOTS.filter(k => !slots[k])

            if (missing.length > 0) {
                return res.json({ success: true, reply: BOOKING_PROMPTS[missing[0]], session: { ...slots, _mode: 'booking' }, done: false, mode: 'booking' })
            }

            // All slots filled — create booking
            const booking = await Booking.create({
                name: slots.name,
                email: slots.email,
                phone: slots.phone || '',
                date: slots.date,
                time: slots.time,
                guests: Number(slots.guests),
                requests: 'Booked via AI Concierge',
                status: 'Pending',
            })
            return res.json({
                success: true,
                reply: `✅ **Booking Confirmed!**\n\nTable for **${slots.guests} guests** on **${slots.date}** at **${slots.time}** under **${slots.name}**.\n\n📧 Confirmation will be sent to ${slots.email}\n🔖 Ref: #${booking._id.toString().slice(-6).toUpperCase()}\n\nWe look forward to serving you! 🍴`,
                session: {},
                done: true,
                bookingId: booking._id,
            })
        }

        // ── INTENT DETECTION MODE ─────────────────────────────────
        const intent = detectIntent(text)

        if (intent) {
            const reply = typeof intent.response === 'function' ? await intent.response() : intent.response

            if (intent.startBooking) {
                // Switch to booking slot-collection mode
                return res.json({ success: true, reply, session: { _mode: 'booking' }, done: false, mode: 'booking' })
            }

            return res.json({ success: true, reply, session, done: false })
        }

        // ── No intent matched — try to be helpful ─────────────────
        // Check if user typed a dish name
        const dishSearch = await MenuItem.findOne({
            $or: [
                { name: { $regex: text, $options: 'i' } },
                { description: { $regex: text, $options: 'i' } },
                { tags: { $regex: text, $options: 'i' } },
            ]
        }).select('name category price isVeg description')

        if (dishSearch) {
            return res.json({
                success: true,
                reply: `🍽️ **${dishSearch.name}**\n\n${dishSearch.isVeg ? '🟢 Vegetarian' : '🔴 Non-Vegetarian'} | ${dishSearch.category}\n💰 Price: ₹${dishSearch.price}\n\n📝 ${dishSearch.description}\n\nWould you like to book a table to enjoy this dish? Just say *"book a table"*!`,
                session,
                done: false,
            })
        }

        // Fallback response
        return res.json({
            success: true,
            reply: `I'm not sure I understood that. I'm the **${INFO.name}** AI assistant and I can help with:\n\n🍽️ Menu & specific dishes\n⏰ Opening hours\n📍 Location & directions\n📅 Table booking\n💰 Prices\n🌟 Popular dishes\n🥗 Veg / Non-veg options\n🎉 Events & private dining\n\nTry asking: *"What starters do you have?"*, *"Tell me about Buggy Foods"*, or *"Book a table for 2 tonight"*`,
            session,
            done: false,
        })

    } catch (err) {
        console.error('[Chatbot Error]', err.message)
        res.status(500).json({ success: false, reply: 'Sorry, something went wrong. Please try again.', done: false })
    }
})

module.exports = router
