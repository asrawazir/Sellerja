document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  renderNav();
  await updateCartBadge();

  const checkoutForm = document.getElementById('checkout-form');
  const ordersList = document.getElementById('orders-list');

  if (checkoutForm) await initCheckout();
  if (ordersList) await loadOrders();
});

// ── CHECKOUT PAGE ──────────────────────────
let checkoutCart = [];

async function initCheckout() {
  await loadCheckoutCart();

  const form = document.getElementById('checkout-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await placeOrder(form);
  });
}

async function loadCheckoutCart() {
  const summaryEl = document.getElementById('checkout-summary');
  try {
    checkoutCart = await api.get('/api/cart');

    if (checkoutCart.length === 0) {
      summaryEl.innerHTML = `<div class="empty-state" style="padding:32px 0">
        <span class="icon">🛒</span><h3>Cart is empty</h3>
        <a href="/" class="btn btn-primary">Browse Products</a>
      </div>`;
      document.querySelector('button[type="submit"]').disabled = true;
      return;
    }

    const subtotal = checkoutCart.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax = subtotal * 0.15;
    const total = subtotal + tax;

    summaryEl.innerHTML = `
      ${checkoutCart.map(item => `
        <div class="checkout-item">
          <img src="${item.image_url}" alt="${escHtml(item.name)}"
               onerror="this.src='https://picsum.photos/seed/${item.product_id}/600/600'">
          <div class="checkout-item-info">
            <div class="checkout-item-name">${escHtml(item.name)}</div>
            <div class="checkout-item-qty">x${item.quantity}</div>
          </div>
          <div class="checkout-item-price">${formatPrice(item.price * item.quantity)}</div>
        </div>
      `).join('')}
      <div style="border-top:1px solid var(--border);margin-top:16px;padding-top:16px;">
        <div class="summary-line"><span class="label">Subtotal</span><span class="value">${formatPrice(subtotal)}</span></div>
        <div class="summary-line"><span class="label">Tax (15%)</span><span class="value">${formatPrice(tax)}</span></div>
        <div class="summary-total"><span>Total</span><span class="value">${formatPrice(total)}</span></div>
      </div>
    `;
  } catch (err) {
    summaryEl.innerHTML = `<p style="color:var(--error)">Failed to load cart: ${err.message}</p>`;
  }
}

async function placeOrder(form) {
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = 'Placing order...';

  const payload = {
    shipping_name: form.shipping_name.value.trim(),
    shipping_address: form.shipping_address.value.trim(),
    shipping_city: form.shipping_city.value.trim(),
    shipping_phone: form.shipping_phone.value.trim(),
  };

  try {
    const result = await api.post('/api/orders', payload);
    showOrderSuccess(result.order_id, result.total);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.textContent = orig;
  }
}

function showOrderSuccess(orderId, total) {
  const main = document.getElementById('checkout-main');
  main.innerHTML = `
    <div class="order-success">
      <div class="success-icon">✓</div>
      <h2>Order Placed!</h2>
      <p>Thank you for your order. We've received it and are processing it now.</p>
      <div class="order-id">Order #${orderId}</div>
      <p style="font-size:0.9rem">Total charged: <strong style="color:var(--accent)">${formatPrice(total)}</strong></p>
      <p style="color:var(--text-muted);font-size:0.85rem;margin-top:16px">Redirecting to your orders in 3 seconds...</p>
      <div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <a href="/orders.html" class="btn btn-primary">View Orders</a>
        <a href="/" class="btn btn-secondary">Continue Shopping</a>
      </div>
    </div>
  `;
  updateCartBadge();
  setTimeout(() => window.location.href = '/orders.html', 3000);
}

// ── ORDERS LIST PAGE ──────────────────────────
async function loadOrders() {
  const container = document.getElementById('orders-list');
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const orders = await api.get('/api/orders');

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="icon">📦</span>
          <h3>No orders yet</h3>
          <p>Place your first order to see it here</p>
          <a href="/" class="btn btn-primary">Shop Now</a>
        </div>`;
      return;
    }

    container.innerHTML = `<div class="orders-list">${orders.map(o => renderOrderCard(o)).join('')}</div>`;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><span class="icon">⚠</span><h3>Error</h3><p>${err.message}</p></div>`;
  }
}

function renderOrderCard(order) {
  return `
    <div class="order-card" id="order-${order.id}">
      <div class="order-card-header" onclick="toggleOrder(${order.id})">
        <div>
          <div class="order-id-text">Order #${order.id}</div>
          <div class="order-meta">${formatDate(order.created_at)}</div>
        </div>
        <span class="status-badge status-${order.status}">${order.status}</span>
        <span class="order-total-badge">${formatPrice(order.total_amount)}</span>
        <span class="order-chevron">▼</span>
      </div>
      <div class="order-items-panel" id="items-${order.id}">
        <div class="spinner" style="width:24px;height:24px;margin:16px auto;border-width:2px;"></div>
      </div>
    </div>
  `;
}

async function toggleOrder(id) {
  const card = document.getElementById(`order-${id}`);
  const panel = document.getElementById(`items-${id}`);
  const isExpanded = card.classList.contains('expanded');

  card.classList.toggle('expanded', !isExpanded);

  if (!isExpanded && !panel.dataset.loaded) {
    panel.dataset.loaded = '1';
    try {
      const order = await api.get(`/api/orders/${id}`);
      panel.innerHTML = order.items.map(item => `
        <div class="order-item-row">
          <img src="${item.image_url}" alt="${escHtml(item.name)}"
               onerror="this.src='https://picsum.photos/seed/${item.product_id}/600/600'">
          <span class="order-item-name">${escHtml(item.name)}</span>
          <span class="order-item-qty">x${item.quantity}</span>
          <span class="order-item-price">${formatPrice(item.price_at_purchase * item.quantity)}</span>
        </div>
      `).join('') || '<p style="color:var(--text-muted);padding:12px 0">No items found</p>';
    } catch {
      panel.innerHTML = '<p style="color:var(--error);padding:12px 0">Failed to load items</p>';
    }
  }
}

window.toggleOrder = toggleOrder;
