let allProducts = [];
let activeCategory = 'All';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
  renderNav();
  await updateCartBadge();

  const grid = document.getElementById('products-grid');
  if (grid) await initProductsPage();

  const detail = document.getElementById('product-detail');
  if (detail) await initProductDetail();
});

// ── PRODUCTS LISTING PAGE ──────────────────────────
async function initProductsPage() {
  const params = new URLSearchParams(window.location.search);
  const initialSearch = params.get('search') || '';
  const initialCat = params.get('category') || 'All';

  if (initialSearch) {
    const searchInput = document.getElementById('header-search');
    if (searchInput) searchInput.value = initialSearch;
    searchQuery = initialSearch;
  }

  activeCategory = initialCat;
  highlightFilter(activeCategory);

  await loadProducts();
  setupSearchFilter();
  setupCategoryFilters();
}

async function loadProducts() {
  const grid = document.getElementById('products-grid');
  showGridSkeleton(grid);

  try {
    allProducts = await api.get('/api/products');
    renderProducts();
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="icon">⚠</span><h3>Failed to load products</h3><p>${err.message}</p></div>`;
  }
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('products-count');

  let filtered = allProducts;

  if (activeCategory !== 'All') {
    filtered = filtered.filter(p => p.category === activeCategory);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }

  if (countEl) {
    countEl.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''} found`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <span class="icon">🔍</span>
        <h3>No products found</h3>
        <p>Try adjusting your search or filters</p>
        <button class="btn btn-secondary" onclick="clearFilters()">Clear Filters</button>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map((p, i) => `
    <div class="product-card" onclick="location.href='/product.html?id=${p.id}'"
         style="animation: slideUp 0.4s cubic-bezier(0.34,1.1,0.64,1) ${i * 0.05}s both;">
      <div class="product-card-img">
        <img src="${p.image_url}" alt="${escHtml(p.name)}" loading="lazy"
             onerror="this.src='https://picsum.photos/seed/${p.id}/600/600'">
        <span class="product-category-badge">${escHtml(p.category)}</span>
      </div>
      <div class="product-card-body">
        <h3 class="product-card-name">${escHtml(p.name)}</h3>
        <p class="product-card-desc">${escHtml(p.description)}</p>
        <div class="product-card-footer">
          <span class="product-price">${formatPrice(p.price)}</span>
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); addToCart(${p.id}, event)">
            + Cart
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function showGridSkeleton(grid) {
  grid.innerHTML = Array.from({length: 8}, () => `
    <div class="product-card">
      <div class="skeleton" style="aspect-ratio:1; border-radius: var(--radius-lg) var(--radius-lg) 0 0;"></div>
      <div class="product-card-body">
        <div class="skeleton" style="height:18px; margin-bottom:8px; border-radius:6px;"></div>
        <div class="skeleton" style="height:14px; width:70%; margin-bottom:16px; border-radius:6px;"></div>
        <div style="display:flex;justify-content:space-between;">
          <div class="skeleton" style="height:22px; width:70px; border-radius:6px;"></div>
          <div class="skeleton" style="height:32px; width:60px; border-radius:8px;"></div>
        </div>
      </div>
    </div>
  `).join('');
}

function setupSearchFilter() {
  const input = document.getElementById('header-search');
  if (!input) return;

  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      searchQuery = input.value;
      renderProducts();
    }, 280);
  });
}

function setupCategoryFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.category;
      highlightFilter(activeCategory);
      renderProducts();
    });
  });
}

function highlightFilter(cat) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === cat);
  });
}

function clearFilters() {
  searchQuery = '';
  activeCategory = 'All';
  const input = document.getElementById('header-search');
  if (input) input.value = '';
  highlightFilter('All');
  renderProducts();
}

window.clearFilters = clearFilters;

// ── PRODUCT DETAIL PAGE ──────────────────────────
async function initProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) { window.location.href = '/'; return; }

  const container = document.getElementById('product-detail');
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const p = await api.get(`/api/products/${id}`);
    renderProductDetail(p);
  } catch {
    container.innerHTML = `<div class="empty-state"><span class="icon">⚠</span><h3>Product not found</h3><a href="/" class="btn btn-primary">Back to Shop</a></div>`;
  }
}

function renderProductDetail(p) {
  document.title = `${p.name} – Sellerja`;

  const stockStatus = p.stock > 10
    ? `<span class="stock-dot"></span> In Stock (${p.stock} available)`
    : p.stock > 0
    ? `<span class="stock-dot low"></span> Low Stock (${p.stock} left)`
    : `<span class="stock-dot out"></span> Out of Stock`;

  const maxQty = Math.min(p.stock, 10);

  document.getElementById('product-detail').innerHTML = `
    <div class="breadcrumb">
      <a href="/">Home</a>
      <span class="sep">›</span>
      <a href="/?category=${encodeURIComponent(p.category)}">${escHtml(p.category)}</a>
      <span class="sep">›</span>
      <span class="current">${escHtml(p.name)}</span>
    </div>

    <div class="product-detail">
      <div class="product-detail-img">
        <img src="${p.image_url}" alt="${escHtml(p.name)}"
             onerror="this.src='https://picsum.photos/seed/${p.id}/600/600'">
      </div>

      <div class="product-detail-info">
        <span class="product-detail-category">${escHtml(p.category)}</span>
        <h1 class="product-detail-name">${escHtml(p.name)}</h1>
        <div class="product-detail-price">${formatPrice(p.price)}</div>
        <p class="product-detail-desc">${escHtml(p.description)}</p>

        <div class="stock-indicator">${stockStatus}</div>

        ${p.stock > 0 ? `
          <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
            <div class="qty-selector">
              <button class="qty-btn" onclick="changeQty(-1)" ${maxQty < 2 ? 'disabled' : ''}>−</button>
              <input class="qty-display" id="qty-input" type="number" value="1" min="1" max="${maxQty}" readonly>
              <button class="qty-btn" onclick="changeQty(1)">+</button>
            </div>
            <button class="btn btn-primary btn-lg" onclick="addToCart(${p.id})" id="add-to-cart-btn">
              🛒 Add to Cart
            </button>
          </div>
        ` : `
          <button class="btn btn-secondary btn-lg" disabled>Out of Stock</button>
        `}

        <a href="/" class="back-link">← Back to Products</a>
      </div>
    </div>
  `;
}

let currentQty = 1;
let currentMaxQty = 10;

function changeQty(delta) {
  const input = document.getElementById('qty-input');
  if (!input) return;
  const max = parseInt(input.max);
  currentQty = Math.max(1, Math.min(currentQty + delta, max));
  input.value = currentQty;
}

window.changeQty = changeQty;

// ── ADD TO CART (shared) ──────────────────────────
async function addToCart(productId, event) {
  if (!getToken()) {
    window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    return;
  }

  const btn = event ? event.target.closest('button') : document.getElementById('add-to-cart-btn');
  const qty = document.getElementById('qty-input') ? parseInt(document.getElementById('qty-input').value) : 1;

  if (btn) {
    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '✓ Added!';
    btn.style.background = 'linear-gradient(135deg, var(--success), #16a34a)';
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.style.background = '';
      btn.disabled = false;
    }, 1500);
  }

  try {
    await api.post('/api/cart', { product_id: productId, quantity: qty });
    showToast('Added to cart!', 'success');
    await updateCartBadge();
    spawnParticles(btn);
  } catch (err) {
    showToast(err.message, 'error');
    if (btn) {
      btn.disabled = false;
    }
  }
}

window.addToCart = addToCart;

function spawnParticles(btn) {
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  for (let i = 0; i < 6; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${rect.left + rect.width/2 + (Math.random()-0.5)*30}px;
      top: ${rect.top + rect.height/2}px;
      animation-delay: ${Math.random()*0.3}s;
      animation-duration: ${1.5 + Math.random()}s;
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 3000);
  }
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.escHtml = escHtml;
