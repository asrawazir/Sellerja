const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const items = db.all(`
    SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price,
           p.image_url, p.category, p.stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
    ORDER BY ci.id DESC
  `, [req.user.id]);
  res.json(items);
});

router.post('/', (req, res) => {
  const { product_id, quantity = 1 } = req.body;

  if (!product_id) return res.status(400).json({ error: 'product_id is required' });

  const product = db.get('SELECT id, stock FROM products WHERE id = ?', [product_id]);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const qty = parseInt(quantity);
  if (!qty || qty < 1) return res.status(400).json({ error: 'Quantity must be at least 1' });

  const existing = db.get(
    'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
    [req.user.id, product_id]
  );

  if (existing) {
    const newQty = Math.min(existing.quantity + qty, product.stock, 10);
    db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
  } else {
    db.run(
      'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
      [req.user.id, product_id, Math.min(qty, product.stock, 10)]
    );
  }

  res.json({ success: true });
});

router.put('/:id', (req, res) => {
  const { quantity } = req.body;
  const qty = parseInt(quantity);

  if (!qty || qty < 1) return res.status(400).json({ error: 'Quantity must be at least 1' });

  const item = db.get(
    'SELECT ci.id, p.stock FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = ? AND ci.user_id = ?',
    [req.params.id, req.user.id]
  );

  if (!item) return res.status(404).json({ error: 'Cart item not found' });

  const newQty = Math.min(qty, item.stock, 10);
  db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, req.params.id]);
  res.json({ success: true, quantity: newQty });
});

router.delete('/:id', (req, res) => {
  const result = db.run(
    'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (result.changes === 0) return res.status(404).json({ error: 'Cart item not found' });
  res.json({ success: true });
});

router.delete('/', (req, res) => {
  db.run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
  res.json({ success: true });
});

module.exports = router;
