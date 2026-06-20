document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  renderNav();
  await loadCart();
  await updateCartBadge();
});

let cartItems = [];

async function loadCart() {
  const container = document.getElementById('cart-container');
  container.innerHTML = '<div class="spinner"></div>';

  try {
    cartItems = await api.get('/api/cart');
    renderCart();
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><span class="icon">⚠</span><h3>Failed to load cart</h3><p>${err.message}</p></div>`;
  }
}

function renderCart() {
  const container = document.getElementById('cart-container');

  if (cartItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="icon">🛒</span>
        <h3>Your cart is empty</h3>
        <p>Add some products to get started</p>
        <a href="/" class="btn btn-primary">Browse Products</a>
      </div>`;
    renderSummary(0, 0);
    return;
  }

  const rows = cartItems.map(item => `
    <tr data-id="${item.id}">
      <td>
        <div class="cart-item-info">
          <div class="cart-item-img">
            <img src="${item.image_url}" alt="${escHtml(item.name)}"
                 onerror="this.src='https://picsum.photos/seed/${item.product_id}/600/600'">
          </div>
          <div>
            <div class="cart-item-name">${escHtml(item.name)}</div>
            <div class="cart-item-cat">${escHtml(item.category)}</div>
          </div>
        </div>
      </td>
      <td class="price-cell">${formatPrice(item.price)}</td>
      <td>
        <input class="cart-qty-input" type="number" value="${item.quantity}"
               min="1" max="${Math.min(item.stock, 10)}"
               data-id="${item.id}" onchange="updateQty(${item.id}, this.value)">
      </td>
      <td class="subtotal-cell">${formatPrice(item.price * item.quantity)}</td>
      <td>
        <button class="btn btn-danger" onclick="removeItem(${item.id})">Remove</button>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="cart-layout">
      <div class="cart-table-wrap">
        <table class="cart-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <aside class="order-summary">
        <h3>Order Summary</h3>
        ${renderSummaryHTML()}
        <div class="summary-cta">
          <a href="/checkout.html" class="btn btn-primary btn-full btn-lg">Proceed to Checkout →</a>
          <a href="/" class="btn btn-secondary btn-full">Continue Shopping</a>
        </div>
      </aside>
    </div>
  `;
}

function calcTotals() {
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

function renderSummaryHTML() {
  const { subtotal, tax, total } = calcTotals();
  return `
    <div class="summary-line"><span class="label">Subtotal</span><span class="value">${formatPrice(subtotal)}</span></div>
    <div class="summary-line"><span class="label">Tax (15%)</span><span class="value">${formatPrice(tax)}</span></div>
    <div class="summary-total"><span>Total</span><span class="value">${formatPrice(total)}</span></div>
  `;
}

function renderSummary(subtotal, tax) {
  const summaryEl = document.getElementById('order-summary-content');
  if (summaryEl) {
    summaryEl.innerHTML = renderSummaryHTML();
  }
}

async function updateQty(id, newQty) {
  const qty = parseInt(newQty);
  if (!qty || qty < 1) return;

  try {
    const result = await api.put(`/api/cart/${id}`, { quantity: qty });
    const item = cartItems.find(i => i.id === id);
    if (item) item.quantity = result.quantity || qty;
    refreshSummary();
    updateSubtotal(id);
    await updateCartBadge();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function updateSubtotal(id) {
  const item = cartItems.find(i => i.id === id);
  if (!item) return;
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (row) {
    const subtotalCell = row.querySelector('.subtotal-cell');
    if (subtotalCell) subtotalCell.textContent = formatPrice(item.price * item.quantity);
  }
}

function refreshSummary() {
  const aside = document.querySelector('.order-summary');
  if (aside) {
    const h3 = aside.querySelector('h3');
    aside.innerHTML = '';
    if (h3) aside.appendChild(h3);
    aside.insertAdjacentHTML('beforeend', renderSummaryHTML());
    aside.insertAdjacentHTML('beforeend', `
      <div class="summary-cta">
        <a href="/checkout.html" class="btn btn-primary btn-full btn-lg">Proceed to Checkout →</a>
        <a href="/" class="btn btn-secondary btn-full">Continue Shopping</a>
      </div>
    `);
  }
}

async function removeItem(id) {
  try {
    await api.del(`/api/cart/${id}`);
    cartItems = cartItems.filter(i => i.id !== id);
    showToast('Item removed', 'info');
    renderCart();
    await updateCartBadge();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

window.updateQty = updateQty;
window.removeItem = removeItem;
