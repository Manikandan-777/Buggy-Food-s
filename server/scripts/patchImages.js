require('dotenv').config()
const mongoose = require('mongoose')
const MenuItem = require('../models/MenuItem')

// 100 unique Unsplash images — one per dish, matched by exact name
const IMAGE_MAP = {
    // ── STARTERS (25) ──────────────────────────────────────────────
    'Bruschetta al Pomodoro': 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&q=80',
    'Crispy Calamari': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80',
    'Wild Mushroom Soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80',
    'Chicken Tikka Skewers': 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&q=80',
    'Paneer Tikka': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80',
    'Garlic Prawns': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
    'Spinach Artichoke Dip': 'https://images.unsplash.com/photo-1576402187878-974f70c890a5?w=600&q=80',
    'Peri Peri Wings': 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&q=80',
    'Vegetable Spring Rolls': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    'Chilli Cheese Toast': 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&q=80',
    'Prawn Cocktail': 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&q=80',
    'Loaded Nachos': 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&q=80',
    'Chicken Satay': 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&q=80',
    'Hummus with Pita': 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=600&q=80',
    'Onion Bhaji': 'https://images.unsplash.com/photo-1593759608142-e976c22ab2e9?w=600&q=80',
    'Stuffed Mushrooms': 'https://images.unsplash.com/photo-1621958608440-f46cade47d3e?w=600&q=80',
    'Fish Tikka': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
    'Caprese Salad': 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&q=80',
    'Lamb Seekh Kebab': 'https://images.unsplash.com/photo-1529694157872-4e0c0f3b238b?w=600&q=80',
    'Corn on the Cob': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&q=80',
    'Tandoori Aloo': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80',
    'Crab Cakes': 'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=600&q=80',
    'Tomato Basil Soup': 'https://images.unsplash.com/photo-1571104508999-893933ded431?w=600&q=80',
    'Cheese Quesadilla': 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=600&q=80',
    'Chicken Caesar Salad': 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80',

    // ── MAINS (35) ─────────────────────────────────────────────────
    'Grilled Tenderloin Steak': 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80',
    'Pan-Seared Salmon': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80',
    'Truffle Risotto': 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80',
    'Margherita Pizza': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
    'Butter Chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80',
    'Palak Paneer': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
    'Lamb Rogan Josh': 'https://images.unsplash.com/photo-1545565206-aef9f8d52613?w=600&q=80',
    'Pasta Carbonara': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
    'Chicken Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
    'Vegetable Biryani': 'https://images.unsplash.com/photo-1645117122405-7b81e5f41e6c?w=600&q=80',
    'BBQ Pulled Pork Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    'Mushroom Stroganoff': 'https://images.unsplash.com/photo-1569918630829-5e1cd0eded69?w=600&q=80',
    'Fish and Chips': 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=80',
    'Paneer Butter Masala': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80',
    'Chicken Alfredo': 'https://images.unsplash.com/photo-1645112411341-18d37543e12f?w=600&q=80',
    'Dal Makhani': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
    'Prawn Masala': 'https://images.unsplash.com/photo-1690983823115-8041b3c1b7ff?w=600&q=80',
    'Cheese Burst Pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
    'Mutton Korma': 'https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=600&q=80',
    'Thai Green Curry': 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80',
    'Veg Thai Curry': 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=600&q=80',
    'Grilled Chicken with Quinoa': 'https://images.unsplash.com/photo-1485704686097-ed47f7263ca4?w=600&q=80',
    'Mushroom & Truffle Pasta': 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&q=80',
    'Chicken Shawarma Wrap': 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&q=80',
    'Paneer Lababdar': 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=600&q=80',
    'Spaghetti Bolognese': 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=600&q=80',
    'Chicken Pesto Pasta': 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&q=80',
    'Chana Masala': 'https://images.unsplash.com/photo-1631452180775-7c8691ea8e80?w=600&q=80',
    'Lamb Chops': 'https://images.unsplash.com/photo-1611566962645-a43edde0b90b?w=600&q=80',
    'Tandoori Chicken': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80',
    'Veg Risotto': 'https://images.unsplash.com/photo-1523986490752-c28064f26be4?w=600&q=80',
    'Chicken Tikka Masala': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
    'Mushroom Pumpkin Curry': 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80',
    'Beef Tacos (3 pcs)': 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&q=80',
    'Grilled Sea Bass': 'https://images.unsplash.com/photo-1504472478235-9bc48ba4d60f?w=600&q=80',

    // ── DESSERTS (20) ──────────────────────────────────────────────
    'Chocolate Lava Cake': 'https://images.unsplash.com/photo-1602351447937-745cb720612f?w=600&q=80',
    'Crème Brûlée': 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=600&q=80',
    'Tiramisu': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80',
    'Mango Panna Cotta': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
    'Gulab Jamun': 'https://images.unsplash.com/photo-1666488706927-930e7df57e18?w=600&q=80',
    'Cheesecake Slice': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&q=80',
    'Brownie with Ice Cream': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80',
    'Ras Malai': 'https://images.unsplash.com/photo-1672843703985-8d58e7b64f48?w=600&q=80',
    'Sticky Toffee Pudding': 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=600&q=80',
    'Gajar Halwa': 'https://images.unsplash.com/photo-1648490428882-b83c219ce4e0?w=600&q=80',
    'Lemon Tart': 'https://images.unsplash.com/photo-1562440499-64e9a6dde0bf?w=600&q=80',
    'Chocolate Mousse': 'https://images.unsplash.com/photo-1511138788855-cd254202c4b9?w=600&q=80',
    'Apple Crumble': 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80',
    'Kulfi Falooda': 'https://images.unsplash.com/photo-1629380880099-da34f445fdca?w=600&q=80',
    'Waffles with Berries': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
    'Baklava': 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&q=80',
    'Ice Cream Sundae': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80',
    'Kheer': 'https://images.unsplash.com/photo-1615361200141-f45040f367be?w=600&q=80',
    'Molten Salted Caramel Cake': 'https://images.unsplash.com/photo-1607478900766-efe13248b125?w=600&q=80',
    'Fruit Sorbet (3 scoops)': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&q=80',

    // ── DRINKS (20) ────────────────────────────────────────────────
    'Signature Cocktail': 'https://images.unsplash.com/photo-1534353473418-4cfa0c5faa7d?w=600&q=80',
    'Aged Pinot Noir': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80',
    'Classic Mojito': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&q=80',
    'Virgin Pina Colada': 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&q=80',
    'Mango Lassi': 'https://images.unsplash.com/photo-1606471191009-63994c53433b?w=600&q=80',
    'Watermelon Mint Cooler': 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=600&q=80',
    'Cold Brew Coffee': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80',
    'Sparkling Rose': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    'Espresso Martini': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80',
    'Masala Chai': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80',
    'Blue Lagoon Mocktail': 'https://images.unsplash.com/photo-1560963689-b5682b6440f8?w=600&q=80',
    'Old Fashioned': 'https://images.unsplash.com/photo-1574096079513-d8259312b785?w=600&q=80',
    'Strawberry Lemonade': 'https://images.unsplash.com/photo-1492825353972-559957b6b2e5?w=600&q=80',
    'Chardonnay': 'https://images.unsplash.com/photo-1586370434639-0fe43b2d32e6?w=600&q=80',
    'Matcha Latte': 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=600&q=80',
    'Tequila Sunrise': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80',
    'Coconut Water': 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=600&q=80',
    'Fresh Lime Soda': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    'Passion Fruit Margarita': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80',
    'Hot Chocolate': 'https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=600&q=80',
}

async function patchImages() {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('✅ Connected to MongoDB')

        const items = await MenuItem.find({})
        console.log(`📦 Found ${items.length} menu items in DB`)

        let updated = 0, skipped = 0, notFound = 0

        for (const item of items) {
            const newImg = IMAGE_MAP[item.name]
            if (!newImg) {
                console.warn(`  ⚠️  No image mapping for: "${item.name}"`)
                notFound++
                continue
            }
            if (item.image === newImg) { skipped++; continue }

            await MenuItem.findByIdAndUpdate(item._id, { image: newImg })
            console.log(`  ✅ Updated: ${item.name}`)
            updated++
        }

        console.log(`\n🎉 Done! Updated: ${updated} | Skipped (same): ${skipped} | Not mapped: ${notFound}`)
        process.exit(0)
    } catch (err) {
        console.error('❌ Error:', err.message)
        process.exit(1)
    }
}

patchImages()
