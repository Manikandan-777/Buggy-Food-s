require('dotenv').config()
const mongoose = require('mongoose')
const Admin = require('../models/Admin')
const MenuItem = require('../models/MenuItem')

const SEED_MENU = [
    // ─── STARTERS (25 dishes) ───────────────────────────────────────
    { name: 'Bruschetta al Pomodoro', category: 'Starters', price: 320, description: 'Toasted baguette with fresh tomatoes, basil, and extra virgin olive oil.', image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&q=80', isVeg: true, featured: true },
    { name: 'Crispy Calamari', category: 'Starters', price: 490, description: 'Golden-fried calamari rings served with zesty lemon aioli and marinara sauce.', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80', isVeg: false, featured: false },
    { name: 'Wild Mushroom Soup', category: 'Starters', price: 280, description: 'Velvety cream of wild mushroom with truffle oil and chive cream.', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80', isVeg: true, featured: false },
    { name: 'Chicken Tikka Skewers', category: 'Starters', price: 420, description: 'Tender chicken marinated in spiced yogurt, char-grilled on skewers.', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80', isVeg: false, featured: true },
    { name: 'Paneer Tikka', category: 'Starters', price: 360, description: 'Soft cottage cheese cubes marinated in saffron yogurt and grilled to perfection.', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80', isVeg: true, featured: true },
    { name: 'Garlic Prawns', category: 'Starters', price: 580, description: 'Juicy tiger prawns sautéed in garlic butter, white wine, and fresh parsley.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80', isVeg: false, featured: false },
    { name: 'Spinach Artichoke Dip', category: 'Starters', price: 290, description: 'Warm cheesy dip with creamed spinach and artichoke hearts, served with nachos.', image: 'https://images.unsplash.com/photo-1576402187878-974f70c890a5?w=600&q=80', isVeg: true, featured: false },
    { name: 'Peri Peri Wings', category: 'Starters', price: 440, description: 'Crispy chicken wings tossed in bold peri peri sauce with a ranch dip.', image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&q=80', isVeg: false, featured: false },
    { name: 'Vegetable Spring Rolls', category: 'Starters', price: 250, description: 'Crispy rolls filled with stir-fried vegetables and glass noodles with sweet chili sauce.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80', isVeg: true, featured: false },
    { name: 'Chilli Cheese Toast', category: 'Starters', price: 220, description: 'Toasted bread topped with melted cheese, green chilies, and herbs.', image: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&q=80', isVeg: true, featured: false },
    { name: 'Prawn Cocktail', category: 'Starters', price: 520, description: 'Classic Marie Rose prawn cocktail on a bed of shredded lettuce with lemon wedges.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80', isVeg: false, featured: false },
    { name: 'Loaded Nachos', category: 'Starters', price: 310, description: 'Crispy tortilla chips with salsa, guacamole, sour cream, jalapeños and melted cheddar.', image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&q=80', isVeg: true, featured: false },
    { name: 'Chicken Satay', category: 'Starters', price: 390, description: 'Grilled chicken skewers served with creamy peanut dipping sauce and cucumber salad.', image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&q=80', isVeg: false, featured: false },
    { name: 'Hummus with Pita', category: 'Starters', price: 240, description: 'Smooth chickpea hummus drizzled with olive oil and paprika with warm pita bread.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80', isVeg: true, featured: false },
    { name: 'Onion Bhaji', category: 'Starters', price: 200, description: 'Crispy golden onion fritters with cumin and coriander, served with mint chutney.', image: 'https://images.unsplash.com/photo-1593759608142-e976c22ab2e9?w=600&q=80', isVeg: true, featured: false },
    { name: 'Stuffed Mushrooms', category: 'Starters', price: 330, description: 'Portobello mushrooms filled with herb cream cheese and baked until golden.', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80', isVeg: true, featured: false },
    { name: 'Fish Tikka', category: 'Starters', price: 460, description: 'Chunks of fresh fish marinated in tandoori spices and grilled in clay oven.', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80', isVeg: false, featured: false },
    { name: 'Caprese Salad', category: 'Starters', price: 350, description: 'Buffalo mozzarella with ripe tomatoes, fresh basil, and extra virgin olive oil.', image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&q=80', isVeg: true, featured: false },
    { name: 'Lamb Seekh Kebab', category: 'Starters', price: 510, description: 'Minced lamb kebabs with mint, coriander, and spices, grilled on skewers.', image: 'https://images.unsplash.com/photo-1529694157872-4e0c0f3b238b?w=600&q=80', isVeg: false, featured: false },
    { name: 'Corn on the Cob', category: 'Starters', price: 180, description: 'Charred sweet corn on the cob with butter, chili powder, and lime.', image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&q=80', isVeg: true, featured: false },
    { name: 'Tandoori Aloo', category: 'Starters', price: 260, description: 'Baby potatoes marinated in yogurt and spices, grilled in a tandoor.', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80', isVeg: true, featured: false },
    { name: 'Crab Cakes', category: 'Starters', price: 620, description: 'Pan-fried crab cakes with lemon herb aioli and microgreens salad.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80', isVeg: false, featured: false },
    { name: 'Tomato Basil Soup', category: 'Starters', price: 240, description: 'Slow-cooked tomato soup with fresh basil and a swirl of cream.', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80', isVeg: true, featured: false },
    { name: 'Cheese Quesadilla', category: 'Starters', price: 280, description: 'Crispy flour tortilla filled with melted cheese, peppers, and onions.', image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&q=80', isVeg: true, featured: false },
    { name: 'Chicken Caesar Salad', category: 'Starters', price: 380, description: 'Crisp romaine lettuce with grilled chicken, parmesan shavings, croutons, and classic dressing.', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80', isVeg: false, featured: false },

    // ─── MAINS (35 dishes) ──────────────────────────────────────────
    { name: 'Grilled Tenderloin Steak', category: 'Mains', price: 1850, description: 'Prime 250g tenderloin with roasted vegetables, truffle mash, and red wine jus.', image: 'https://images.unsplash.com/photo-1529694157872-4e0c0f3b238b?w=600&q=80', isVeg: false, featured: true },
    { name: 'Pan-Seared Salmon', category: 'Mains', price: 1290, description: 'Atlantic salmon with lemon butter sauce, capers, and sautéed asparagus.', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80', isVeg: false, featured: true },
    { name: 'Truffle Risotto', category: 'Mains', price: 890, description: 'Creamy Arborio rice with black truffle shavings, parmesan, and fresh herbs.', image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80', isVeg: true, featured: true },
    { name: 'Margherita Pizza', category: 'Mains', price: 650, description: 'Wood-fired pizza with San Marzano tomato, buffalo mozzarella, and fresh basil.', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80', isVeg: true, featured: false },
    { name: 'Butter Chicken', category: 'Mains', price: 750, description: 'Tender chicken in a rich, creamy tomato-cashew gravy served with naan.', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80', isVeg: false, featured: true },
    { name: 'Palak Paneer', category: 'Mains', price: 620, description: 'Fresh cottage cheese in a smooth spinach gravy spiced with cumin and garam masala.', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', isVeg: true, featured: false },
    { name: 'Lamb Rogan Josh', category: 'Mains', price: 950, description: 'Slow-braised lamb in Kashmiri spices with cardamom and saffron-infused gravy.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80', isVeg: false, featured: false },
    { name: 'Pasta Carbonara', category: 'Mains', price: 720, description: 'Spaghetti with pancetta, egg yolk, pecorino cheese, and black pepper.', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80', isVeg: false, featured: false },
    { name: 'Chicken Biryani', category: 'Mains', price: 680, description: 'Fragrant basmati rice cooked with spiced chicken, saffron, and caramelized onions.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', isVeg: false, featured: true },
    { name: 'Vegetable Biryani', category: 'Mains', price: 580, description: 'Aromatic basmati rice layered with seasonal vegetables and whole spices.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', isVeg: true, featured: false },
    { name: 'BBQ Pulled Pork Burger', category: 'Mains', price: 680, description: 'Slow-cooked BBQ pulled pork in a brioche bun with coleslaw and pickles.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80', isVeg: false, featured: false },
    { name: 'Mushroom Stroganoff', category: 'Mains', price: 590, description: 'Earthy mushrooms in a creamy paprika sauce served over egg noodles.', image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80', isVeg: true, featured: false },
    { name: 'Fish and Chips', category: 'Mains', price: 780, description: 'Beer-battered cod fillet with thick-cut fries, mushy peas, and tartare sauce.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80', isVeg: false, featured: false },
    { name: 'Paneer Butter Masala', category: 'Mains', price: 640, description: 'Cottage cheese in a velvety tomato-butter gravy with aromatic spices.', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', isVeg: true, featured: false },
    { name: 'Chicken Alfredo', category: 'Mains', price: 760, description: 'Fettuccine in creamy Alfredo sauce with grilled chicken and parmesan.', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80', isVeg: false, featured: false },
    { name: 'Dal Makhani', category: 'Mains', price: 480, description: 'Black lentils slow-cooked overnight in butter, cream, and tomatoes.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80', isVeg: true, featured: false },
    { name: 'Prawn Masala', category: 'Mains', price: 980, description: 'Tiger prawns cooked in a spiced onion-tomato masala with coastal flavors.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80', isVeg: false, featured: false },
    { name: 'Cheese Burst Pizza', category: 'Mains', price: 780, description: 'Pizza with a cheese-filled crust, loaded with mozzarella, cheddar, and toppings.', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80', isVeg: true, featured: false },
    { name: 'Mutton Korma', category: 'Mains', price: 1050, description: 'Tender mutton in a rich almond-based gravy with whole spices and saffron.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80', isVeg: false, featured: false },
    { name: 'Thai Green Curry', category: 'Mains', price: 820, description: 'Coconut milk curry with bamboo shoots, Thai basil, and your choice of chicken or tofu.', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80', isVeg: false, featured: false },
    { name: 'Veg Thai Curry', category: 'Mains', price: 700, description: 'Fragrant green curry with tofu, bell peppers, and jasmine rice.', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80', isVeg: true, featured: false },
    { name: 'Grilled Chicken with Quinoa', category: 'Mains', price: 820, description: 'Herb-marinated chicken breast with quinoa salad, roasted peppers, and chimichurri.', image: 'https://images.unsplash.com/photo-1529694157872-4e0c0f3b238b?w=600&q=80', isVeg: false, featured: false },
    { name: 'Mushroom & Truffle Pasta', category: 'Mains', price: 860, description: 'Pappardelle with wild mushrooms, truffle paste, and aged parmesan.', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80', isVeg: true, featured: false },
    { name: 'Chicken Shawarma Wrap', category: 'Mains', price: 450, description: 'Lebanese-style chicken shawarma with garlic sauce, pickled turnips, and pita.', image: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&q=80', isVeg: false, featured: false },
    { name: 'Paneer Lababdar', category: 'Mains', price: 680, description: 'Rich, velvety paneer curry with onions, tomatoes, and a hint of fenugreek.', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', isVeg: true, featured: false },
    { name: 'Spaghetti Bolognese', category: 'Mains', price: 740, description: 'Classic meat ragu simmered for hours, tossed with spaghetti and parmesan.', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80', isVeg: false, featured: false },
    { name: 'Chicken Pesto Pasta', category: 'Mains', price: 690, description: 'Penne with grilled chicken, house-made basil pesto, cherry tomatoes, and parmesan.', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80', isVeg: false, featured: false },
    { name: 'Chana Masala', category: 'Mains', price: 440, description: 'Hearty North Indian chickpea curry in a tangy onion-tomato gravy.', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80', isVeg: true, featured: false },
    { name: 'Lamb Chops', category: 'Mains', price: 1650, description: 'French-trimmed lamb chops with rosemary jus, roasted garlic mash, and vegetables.', image: 'https://images.unsplash.com/photo-1529694157872-4e0c0f3b238b?w=600&q=80', isVeg: false, featured: true },
    { name: 'Tandoori Chicken', category: 'Mains', price: 720, description: 'Half chicken marinated in yogurt and classic tandoori spices, baked in clay oven.', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80', isVeg: false, featured: false },
    { name: 'Veg Risotto', category: 'Mains', price: 720, description: 'Creamy Arborio rice with seasonal vegetables, lemon zest, and parmesan.', image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80', isVeg: true, featured: false },
    { name: 'Chicken Tikka Masala', category: 'Mains', price: 780, description: 'Grilled chicken tikka simmered in a creamy spiced tomato gravy.', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80', isVeg: false, featured: false },
    { name: 'Mushroom Pumpkin Curry', category: 'Mains', price: 560, description: 'Button mushrooms and roasted pumpkin in a coconut-spiced gravy.', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80', isVeg: true, featured: false },
    { name: 'Beef Tacos (3 pcs)', category: 'Mains', price: 690, description: 'Corn tortillas with spiced beef, pico de gallo, guacamole, and sour cream.', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&q=80', isVeg: false, featured: false },
    { name: 'Grilled Sea Bass', category: 'Mains', price: 1480, description: 'Whole sea bass grilled with lemon, herbs, and served with sautéed vegetables.', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80', isVeg: false, featured: false },

    // ─── DESSERTS (20 dishes) ───────────────────────────────────────
    { name: 'Chocolate Lava Cake', category: 'Desserts', price: 380, description: 'Warm dark chocolate cake with a molten centre and vanilla bean ice cream.', image: 'https://images.unsplash.com/photo-1602351447937-745cb720612f?w=600&q=80', isVeg: true, featured: false },
    { name: 'Crème Brûlée', category: 'Desserts', price: 320, description: 'Classic French custard with a perfectly caramelized golden sugar crust.', image: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=600&q=80', isVeg: true, featured: false },
    { name: 'Tiramisu', category: 'Desserts', price: 340, description: 'Espresso-soaked ladyfingers layered with mascarpone cream and cocoa.', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80', isVeg: true, featured: false },
    { name: 'Mango Panna Cotta', category: 'Desserts', price: 300, description: 'Silky Italian panna cotta with fresh mango coulis and mint garnish.', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80', isVeg: true, featured: false },
    { name: 'Gulab Jamun', category: 'Desserts', price: 200, description: 'Soft milk dumplings soaked in rose-flavoured sugar syrup, served warm.', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', isVeg: true, featured: false },
    { name: 'Cheesecake Slice', category: 'Desserts', price: 360, description: 'New York-style baked cheesecake on buttery graham cracker base with berry compote.', image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&q=80', isVeg: true, featured: false },
    { name: 'Brownie with Ice Cream', category: 'Desserts', price: 310, description: 'Fudgy dark chocolate brownie served warm with a scoop of vanilla ice cream.', image: 'https://images.unsplash.com/photo-1602351447937-745cb720612f?w=600&q=80', isVeg: true, featured: false },
    { name: 'Ras Malai', category: 'Desserts', price: 220, description: 'Soft cottage cheese dumplings soaked in sweetened saffron milk.', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', isVeg: true, featured: false },
    { name: 'Sticky Toffee Pudding', category: 'Desserts', price: 350, description: 'Moist sponge cake with warm butterscotch toffee sauce and clotted cream.', image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&q=80', isVeg: true, featured: false },
    { name: 'Gajar Halwa', category: 'Desserts', price: 240, description: 'Slow-cooked grated carrots with ghee, milk, sugar, and cardamom, garnished with nuts.', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80', isVeg: true, featured: false },
    { name: 'Lemon Tart', category: 'Desserts', price: 330, description: 'Crisp pastry shell filled with tangy lemon curd and topped with meringue.', image: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=600&q=80', isVeg: true, featured: false },
    { name: 'Chocolate Mousse', category: 'Desserts', price: 280, description: 'Airy dark chocolate mousse with whipped cream and chocolate shavings.', image: 'https://images.unsplash.com/photo-1602351447937-745cb720612f?w=600&q=80', isVeg: true, featured: false },
    { name: 'Apple Crumble', category: 'Desserts', price: 290, description: 'Spiced apple filling topped with buttery oat crumble and vanilla custard.', image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&q=80', isVeg: true, featured: false },
    { name: 'Kulfi Falooda', category: 'Desserts', price: 260, description: 'Traditional Indian ice cream with rose syrup, basil seeds, and vermicelli noodles.', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80', isVeg: true, featured: false },
    { name: 'Waffles with Berries', category: 'Desserts', price: 350, description: 'Crispy Belgian waffles served with mixed berries, whipped cream, and maple syrup.', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80', isVeg: true, featured: false },
    { name: 'Baklava', category: 'Desserts', price: 280, description: 'Layers of golden phyllo pastry filled with pistachios and honey syrup.', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80', isVeg: true, featured: false },
    { name: 'Ice Cream Sundae', category: 'Desserts', price: 250, description: 'Three scoops of ice cream with chocolate sauce, nuts, whipped cream, and a cherry.', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80', isVeg: true, featured: false },
    { name: 'Kheer', category: 'Desserts', price: 190, description: 'Classic Indian rice pudding with cardamom, saffron, and silver leaf.', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', isVeg: true, featured: false },
    { name: 'Molten Salted Caramel Cake', category: 'Desserts', price: 400, description: 'Warm salted caramel lava cake with toffee drizzle and sea salt ice cream.', image: 'https://images.unsplash.com/photo-1602351447937-745cb720612f?w=600&q=80', isVeg: true, featured: false },
    { name: 'Fruit Sorbet (3 scoops)', category: 'Desserts', price: 220, description: 'Refreshing trio of mango, lemon, and strawberry sorbet.', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80', isVeg: true, featured: false },

    // ─── DRINKS (20 items) ──────────────────────────────────────────
    { name: 'Signature Cocktail', category: 'Drinks', price: 520, description: 'House blend of aged rum, passion fruit, lime juice, and a hint of rose.', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80', isVeg: true, featured: false },
    { name: 'Aged Pinot Noir', category: 'Drinks', price: 780, description: 'Full-bodied French Pinot Noir with notes of cherry, earth, and subtle oak.', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80', isVeg: true, featured: false },
    { name: 'Classic Mojito', category: 'Drinks', price: 380, description: 'Refreshing blend of white rum, fresh mint, lime juice, and soda water.', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80', isVeg: true, featured: false },
    { name: 'Virgin Pina Colada', category: 'Drinks', price: 320, description: 'Creamy blend of pineapple juice, coconut cream, and crushed ice.', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80', isVeg: true, featured: false },
    { name: 'Mango Lassi', category: 'Drinks', price: 200, description: 'Thick and creamy yogurt-based drink blended with fresh Alphonso mango and cardamom.', image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=80', isVeg: true, featured: false },
    { name: 'Watermelon Mint Cooler', category: 'Drinks', price: 260, description: 'Fresh watermelon juice with mint, lime, and a pinch of black salt.', image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=80', isVeg: true, featured: false },
    { name: 'Cold Brew Coffee', category: 'Drinks', price: 280, description: 'Smooth 18-hour cold brew coffee served over ice with milk.', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80', isVeg: true, featured: false },
    { name: 'Sparkling Rose', category: 'Drinks', price: 650, description: 'Elegant French sparkling Rosé with delicate notes of red berries and peach.', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80', isVeg: true, featured: false },
    { name: 'Espresso Martini', category: 'Drinks', price: 580, description: 'Chilled espresso shaken with vodka, coffee liqueur, and a dash of sugar syrup.', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80', isVeg: true, featured: false },
    { name: 'Masala Chai', category: 'Drinks', price: 120, description: 'Aromatic blend of black tea with ginger, cardamom, cinnamon, and milk.', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80', isVeg: true, featured: false },
    { name: 'Blue Lagoon Mocktail', category: 'Drinks', price: 290, description: 'Vibrant blue curacao, lemonade, and soda, topped with a citrus spiral.', image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=80', isVeg: true, featured: false },
    { name: 'Old Fashioned', category: 'Drinks', price: 680, description: 'Bourbon whiskey with bitters, sugar, and orange peel over a large ice cube.', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80', isVeg: true, featured: false },
    { name: 'Strawberry Lemonade', category: 'Drinks', price: 220, description: 'Fresh-squeezed lemonade blended with strawberry purée and mint leaves.', image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=80', isVeg: true, featured: false },
    { name: 'Chardonnay', category: 'Drinks', price: 720, description: 'Crisp unoaked Chardonnay with notes of green apple, citrus, and white flowers.', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80', isVeg: true, featured: false },
    { name: 'Matcha Latte', category: 'Drinks', price: 260, description: 'Premium Japanese matcha whisked with steamed oat milk and a touch of honey.', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80', isVeg: true, featured: false },
    { name: 'Tequila Sunrise', category: 'Drinks', price: 540, description: 'Tequila, fresh orange juice, and a grenadine sunrise in a tall glass.', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80', isVeg: true, featured: false },
    { name: 'Coconut Water', category: 'Drinks', price: 150, description: 'Pure tender coconut water, chilled and served straight from the shell.', image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=80', isVeg: true, featured: false },
    { name: 'Fresh Lime Soda', category: 'Drinks', price: 130, description: 'Freshly squeezed lime juice with fizzy soda — sweet, salted, or mixed.', image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=80', isVeg: true, featured: false },
    { name: 'Passion Fruit Margarita', category: 'Drinks', price: 560, description: 'Tangy passion fruit blended with tequila, triple sec, and fresh lime juice.', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80', isVeg: true, featured: false },
    { name: 'Hot Chocolate', category: 'Drinks', price: 200, description: 'Velvety Belgian dark chocolate melted in steamed milk with marshmallows on top.', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80', isVeg: true, featured: false },
]

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('✅ Connected to MongoDB')

        // Clear existing data
        await Admin.deleteMany()
        await MenuItem.deleteMany()
        console.log('🧹 Cleared existing data')

        // Create admin
        const admin = new Admin({ username: 'admin', password: 'admin123' })
        await admin.save()
        console.log('👤 Admin created — username: admin, password: admin123')

        // Create menu items
        await MenuItem.insertMany(SEED_MENU)
        console.log(`🍽️  Seeded ${SEED_MENU.length} menu items`)
        console.log(`   📗 Starters: ${SEED_MENU.filter(i => i.category === 'Starters').length}`)
        console.log(`   📘 Mains:    ${SEED_MENU.filter(i => i.category === 'Mains').length}`)
        console.log(`   📙 Desserts: ${SEED_MENU.filter(i => i.category === 'Desserts').length}`)
        console.log(`   📕 Drinks:   ${SEED_MENU.filter(i => i.category === 'Drinks').length}`)

        console.log('\n✅ Database seeded successfully!')
        process.exit(0)
    } catch (err) {
        console.error('❌ Seed error:', err.message)
        process.exit(1)
    }
}

seed()
