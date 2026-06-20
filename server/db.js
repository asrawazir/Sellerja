const { Database } = require('node-sqlite3-wasm');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'sellerja.db');
const db = new Database(DB_PATH);

db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      category TEXT NOT NULL,
      stock INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      shipping_name TEXT,
      shipping_address TEXT,
      shipping_city TEXT,
      shipping_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price_at_purchase REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  const count = db.get('SELECT COUNT(*) as c FROM products');
  if (count.c === 0) seedProducts();
}

function seedProducts() {
  const products = [
    ['ProSound Elite Headphones', 'Experience audio like never before with 40mm neodymium drivers, active noise cancellation, and 30-hour battery life. Premium aluminum construction with memory foam ear cushions for all-day comfort.', 189.99, 'https://picsum.photos/seed/headphones1/600/600', 'Electronics', 45],
    ['UltraView 4K Webcam', 'Crystal-clear 4K resolution at 60fps with AI-powered auto-framing, dual studio-quality microphones, and HDR support. Perfect for streaming, video calls, and content creation.', 129.99, 'https://picsum.photos/seed/webcam2/600/600', 'Electronics', 60],
    ['NexCharge 65W GaN Charger', 'Charge up to 3 devices simultaneously with 65W total output. GaN technology keeps it cool and compact — smaller than a standard charger. Includes USB-C and USB-A ports.', 49.99, 'https://picsum.photos/seed/charger3/600/600', 'Electronics', 120],
    ['SmartTrack Wireless Mouse', 'Ergonomic vertical design reduces wrist strain. 4000 DPI precision sensor, 6 programmable buttons, and up to 70 days battery life. Works seamlessly across Windows and Mac.', 79.99, 'https://picsum.photos/seed/mouse4/600/600', 'Electronics', 85],
    ['Urban Flex Hoodie', 'Premium 400gsm French terry cotton blend with a relaxed oversized fit. Features a kangaroo pocket, ribbed cuffs, and reinforced stitching. Available in 8 colorways.', 89.99, 'https://picsum.photos/seed/hoodie5/600/600', 'Clothing', 200],
    ['Velocity Running Shorts', '4-way stretch recycled polyester with built-in compression liner. Reflective strips for visibility, zippered back pocket, and moisture-wicking technology for peak performance.', 54.99, 'https://picsum.photos/seed/shorts6/600/600', 'Clothing', 150],
    ['Classic Oxford Button-Down', 'Timeless slim-fit Oxford shirt crafted from 100% organic cotton. Non-iron finish stays crisp all day. Perfect for business casual or smart casual looks.', 69.99, 'https://picsum.photos/seed/shirt7/600/600', 'Clothing', 180],
    ["Merino Wool Crew Socks (3-Pack)", "Ultra-soft 80% merino wool blend regulates temperature year-round. Cushioned sole, arch support, and seamless toe construction. The last socks you'll ever need.", 34.99, 'https://picsum.photos/seed/socks8/600/600', 'Clothing', 300],
    ['AeroPress Coffee Maker Pro', 'Make barista-quality coffee in under 2 minutes. Full immersion brewing extracts rich, smooth flavor with no bitterness. Includes 350 microfilters and a carry bag.', 44.99, 'https://picsum.photos/seed/coffee9/600/600', 'Home & Kitchen', 90],
    ['Nordic Ceramic Cookware Set', '5-piece non-stick ceramic set: 8" skillet, 10" skillet, 2-qt saucepan, 4-qt sauté pan, and glass lids. PFOA-free, oven-safe to 450°F, and dishwasher safe.', 249.99, 'https://picsum.photos/seed/cookware10/600/600', 'Home & Kitchen', 40],
    ['SilentCool Air Purifier', 'HEPA H13 filter captures 99.97% of particles down to 0.1 microns. Ultra-quiet 22dB operation, covers up to 500 sq ft, auto mode adjusts to air quality in real time.', 199.99, 'https://picsum.photos/seed/purifier11/600/600', 'Home & Kitchen', 55],
    ['BambooBoard Cutting Set', 'Sustainable bamboo cutting boards in 3 sizes with non-slip feet and juice grooves. Naturally antimicrobial, knife-friendly surface. Includes a wall-mount magnetic rack.', 59.99, 'https://picsum.photos/seed/cutting12/600/600', 'Home & Kitchen', 110],
  ];

  db.run('BEGIN');
  try {
    for (const [name, description, price, image_url, category, stock] of products) {
      db.run(
        'INSERT INTO products (name, description, price, image_url, category, stock) VALUES (?, ?, ?, ?, ?, ?)',
        [name, description, price, image_url, category, stock]
      );
    }
    db.run('COMMIT');
    console.log('Database seeded with 12 products.');
  } catch (e) {
    db.run('ROLLBACK');
    throw e;
  }
}

initDb();

module.exports = db;
