# Sellerja — E-Commerce Platform

A full-stack e-commerce web application built with Express.js, SQLite, and vanilla JavaScript. Dark amber theme, 3D animations, JWT auth.

## Tech Stack

- **Backend:** Express.js (Node.js)
- **Database:** SQLite via `better-sqlite3` (file-based, no setup required)
- **Frontend:** Vanilla HTML + CSS + JavaScript
- **Auth:** JWT tokens stored in localStorage
- **Passwords:** bcrypt hashing

## Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env
# Edit .env and set a strong JWT_SECRET

# 3. Start the server
npm start

# Development (auto-restart)
npm run dev
```

The app runs at **http://localhost:3000**

## Features

- Browse 12 seeded products across 3 categories
- Live search + category filtering
- Register / Login with JWT authentication
- Add to cart, update quantities, remove items
- Place orders with shipping info (atomic SQLite transaction)
- View order history with expandable item details
- Fully responsive dark amber theme with 3D card animations

## API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user → JWT |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/auth/me` | Get current user (protected) |

### Products
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/products` | List all products (supports `?category=` and `?search=`) |
| GET | `/api/products/:id` | Single product detail |

### Cart (JWT required)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/cart` | Get user's cart |
| POST | `/api/cart` | Add item `{ product_id, quantity }` |
| PUT | `/api/cart/:id` | Update quantity `{ quantity }` |
| DELETE | `/api/cart/:id` | Remove item |
| DELETE | `/api/cart` | Clear entire cart |

### Orders (JWT required)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/orders` | Place order from cart |
| GET | `/api/orders` | Order history |
| GET | `/api/orders/:id` | Single order with items |

## Deploy to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select this repo
4. Add environment variables: `PORT=3000`, `JWT_SECRET=<your-secret>`
5. Deploy — Railway auto-detects Node.js and runs `npm start`

## Project Structure

```
sellerja/
├── server/
│   ├── index.js              Express entry point
│   ├── db.js                 SQLite setup & seed data
│   ├── routes/
│   │   ├── auth.js           Register / Login
│   │   ├── products.js       Product listings
│   │   ├── cart.js           Cart management
│   │   └── orders.js         Order placement & history
│   └── middleware/
│       └── auth.js           JWT verification
├── public/
│   ├── index.html            Homepage with product grid
│   ├── product.html          Product detail
│   ├── cart.html             Shopping cart
│   ├── checkout.html         Order form
│   ├── orders.html           Order history
│   ├── login.html
│   ├── register.html
│   ├── css/style.css         Global dark amber styles
│   └── js/
│       ├── api.js            Fetch wrapper + auth utils
│       ├── auth.js           Login/register logic
│       ├── products.js       Product listing & detail
│       ├── cart.js           Cart UI
│       └── orders.js         Checkout & orders
├── package.json
├── .env.example
└── README.md
```
