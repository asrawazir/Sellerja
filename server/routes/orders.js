const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.post('/', (req, res) => {
  const { shipping_name, shipping_address, shipping_city, shipping_phone } = req.body;

  if (!shipping_name || !shipping_address || !shipping_city || !shipping_phone) {
    return res.status(400).json({ error: 'All shipping fields are required' });
  }

  const cartItems = db.all(`
    SELECT ci.quantity, p.id as product_id, p.price, p.stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
  `, [req.user.id]);

  if (cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxedTotal = parseFloat((subtotal * 1.15).toFixed(2));

  let orderId;
  db.run('BEGIN');
  try {
    const orderResult = db.run(`
      INSERT INTO orders (user_id, total_amount, status, shipping_name, shipping_address, shipping_city, shipping_phone)
      VALUES (?, ?, 'pending', ?, ?, ?, ?)
    `, [req.user.id, taxedTotal, shipping_name, shipping_address, shipping_city, shipping_phone]);

    orderId = orderResult.lastInsertRowid;

    for (const item of cartItems) {
      db.run(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    db.run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    db.run('COMMIT');
  } catch (e) {
    db.run('ROLLBACK');
    return res.status(500).json({ error: 'Failed to place order' });
  }

  res.status(201).json({ success: true, order_id: orderId, total: taxedTotal });
});

router.get('/', (req, res) => {
  const orders = db.all(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(orders);
});

router.get('/:id', (req, res) => {
  const order = db.get(
    'SELECT * FROM orders WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );

  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = db.all(`
    SELECT oi.*, p.name, p.image_url, p.category
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `, [req.params.id]);

  res.json({ ...order, items });
});

module.exports = router;
