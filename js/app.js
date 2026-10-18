/**
 * Best Perfume of Pakistan - Storefront Application Logic
 * Integrates with Supabase via PerfumeService
 */

// State
let allPerfumes = [];
let filteredPerfumes = [];
let cart = JSON.parse(localStorage.getItem("bpop_cart") || "[]");
let activeCategory = "All";
let activeGender = "All";
let searchQuery = "";
let sortBy = "featured";

// Pakistani Rupee Formatter
function formatPKR(amount) {
  return "PKR " + Number(amount || 0).toLocaleString("en-PK");
}

// Toast Notification
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  
  const toast = document.createElement("div");
  toast.className = "toast";
  const icon = type === "success" ? "fa-circle-check" : "fa-circle-exclamation";
  toast.innerHTML = `<i class="fa-solid ${icon}" style="color: ${type === 'success' ? '#2ecc71' : '#e74c3c'}"></i> <span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.4s";
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
  updateCartBadge();
  setupEventListeners();
  await loadPerfumes();
});

// Load perfumes from Supabase / Service
async function loadPerfumes() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 60px 0; color: var(--gold-primary);">
      <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
      <p style="margin-top: 15px; color: var(--text-secondary); font-size: 0.9rem;">Connecting to Supabase fragrances...</p>
    </div>
  `;

  try {
    const result = await PerfumeService.getPerfumes();
    allPerfumes = result.data || [];
    
    // Check if table needs schema creation
    if (result.needsSchema) {
      showSchemaNotice();
    }

    applyFilters();
  } catch (error) {
    console.error("Error loading perfumes:", error);
    grid.innerHTML = `
      <div class="empty-catalog-state">
        <div class="empty-icon-wrap"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <h3 class="empty-title">Connection Error</h3>
        <p class="empty-text">Could not load perfumes from Supabase. Please check your network or Supabase tables.</p>
        <a href="admin.html" class="btn-primary"><i class="fa-solid fa-sliders"></i> Open Admin Panel</a>
      </div>
    `;
  }
}

// Notice if database table is not yet created in Supabase
function showSchemaNotice() {
  const banner = document.getElementById("schemaAlertBanner");
  if (banner) {
    banner.style.display = "block";
  }
}

// Apply Filters, Search & Sort
function applyFilters() {
  filteredPerfumes = allPerfumes.filter(p => {
    // Category filter
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    // Gender filter
    const matchGender = activeGender === "All" || p.gender === activeGender;
    // Search query
    const name = (p.name || "").toLowerCase();
    const brand = (p.brand || "").toLowerCase();
    const notes = ((p.top_notes || "") + " " + (p.heart_notes || "") + " " + (p.base_notes || "")).toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || name.includes(q) || brand.includes(q) || notes.includes(q);

    return matchCat && matchGender && matchSearch;
  });

  // Sort
  if (sortBy === "price-low") {
    filteredPerfumes.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sortBy === "price-high") {
    filteredPerfumes.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (sortBy === "name") {
    filteredPerfumes.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  } else {
    // Default featured
    filteredPerfumes.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
  }

  renderProducts();
}

// Render Products Grid
function renderProducts() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  // STRICT RULE: "dont add any products" -> If no products exist, show clean luxury empty state!
  if (filteredPerfumes.length === 0) {
    if (allPerfumes.length === 0) {
      grid.innerHTML = `
        <div class="empty-catalog-state">
          <div class="empty-icon-wrap">
            <i class="fa-solid fa-gem"></i>
          </div>
          <h3 class="empty-title">Best Perfume of Pakistan</h3>
          <p class="empty-text">
            No perfumes have been added to the catalog yet. 
            Store Managers can add luxury fragrances, set prices in PKR, and configure scent notes via the Modern Admin Panel.
          </p>
          <a href="admin.html" class="btn-primary">
            <i class="fa-solid fa-sliders"></i> Go to Admin Panel
          </a>
        </div>
      `;
    } else {
      grid.innerHTML = `
        <div class="empty-catalog-state">
          <div class="empty-icon-wrap">
            <i class="fa-solid fa-magnifying-glass"></i>
          </div>
          <h3 class="empty-title">No Matching Fragrances</h3>
          <p class="empty-text">We couldn't find any fragrances matching your selected filters. Try clearing your search.</p>
          <button class="btn-outline" onclick="resetFilters()">Reset All Filters</button>
        </div>
      `;
    }
    return;
  }

  grid.innerHTML = filteredPerfumes.map(perfume => {
    const hasDiscount = perfume.sale_price && Number(perfume.sale_price) < Number(perfume.price);
    const displayPrice = hasDiscount ? perfume.sale_price : perfume.price;
    const oldPrice = hasDiscount ? perfume.price : null;

    const imgElement = perfume.image_url 
      ? `<img src="${escapeHtml(perfume.image_url)}" alt="${escapeHtml(perfume.name)}" class="card-img" onerror="this.outerHTML='<div class=\\'card-img-placeholder\\'><i class=\\'fa-solid fa-spray-can-sparkles\\'></i><span>${escapeHtml(perfume.name)}</span></div>'">`
      : `<div class="card-img-placeholder"><i class="fa-solid fa-spray-can-sparkles"></i><span>${escapeHtml(perfume.name)}</span></div>`;

    return `
      <div class="perfume-card">
        <div class="card-img-wrap">
          ${imgElement}
          ${perfume.is_featured ? `<span class="card-badge featured"><i class="fa-solid fa-crown"></i> Featured</span>` : `<span class="card-badge">${escapeHtml(perfume.concentration || 'Eau De Parfum')}</span>`}
          <span class="card-gender">${escapeHtml(perfume.gender || 'Unisex')} • ${perfume.volume_ml || 50}ml</span>
        </div>
        <div class="card-body">
          <div class="card-category">${escapeHtml(perfume.category || 'Luxury Fragrance')}</div>
          <h3 class="card-title">${escapeHtml(perfume.name)}</h3>
          <div class="card-brand">${escapeHtml(perfume.brand || 'Best Perfume of Pakistan')}</div>

          ${(perfume.top_notes || perfume.base_notes) ? `
            <div class="scent-notes-preview">
              <strong>Notes:</strong> ${escapeHtml([perfume.top_notes, perfume.heart_notes, perfume.base_notes].filter(Boolean).join(' • '))}
            </div>
          ` : ''}

          <div class="card-footer">
            <div class="price-box">
              <span class="price-main">${formatPKR(displayPrice)}</span>
              ${oldPrice ? `<span class="price-strike">${formatPKR(oldPrice)}</span>` : ''}
            </div>
            <div class="card-actions">
              <button class="btn-card-icon" title="Quick Details" onclick="openQuickView('${perfume.id}')">
                <i class="fa-solid fa-eye"></i>
              </button>
              <button class="btn-add-cart" onclick="addToCart('${perfume.id}')">
                <i class="fa-solid fa-bag-shopping"></i> Add
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Reset filters
function resetFilters() {
  activeCategory = "All";
  activeGender = "All";
  searchQuery = "";
  sortBy = "featured";

  document.querySelectorAll(".cat-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.category === "All");
  });
  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.value = "";
  const genderFilter = document.getElementById("genderFilter");
  if (genderFilter) genderFilter.value = "All";
  const sortFilter = document.getElementById("sortFilter");
  if (sortFilter) sortFilter.value = "featured";

  applyFilters();
}

// Event Listeners Setup
function setupEventListeners() {
  // Category tabs
  const tabs = document.querySelectorAll(".cat-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeCategory = tab.dataset.category;
      applyFilters();
    });
  });

  // Search input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      applyFilters();
    });
  }

  // Gender filter
  const genderFilter = document.getElementById("genderFilter");
  if (genderFilter) {
    genderFilter.addEventListener("change", (e) => {
      activeGender = e.target.value;
      applyFilters();
    });
  }

  // Sort filter
  const sortFilter = document.getElementById("sortFilter");
  if (sortFilter) {
    sortFilter.addEventListener("change", (e) => {
      sortBy = e.target.value;
      applyFilters();
    });
  }

  // Cart Drawer toggles
  const cartBtn = document.getElementById("cartToggleBtn");
  const cartDrawer = document.getElementById("cartDrawer");
  const cartOverlay = document.getElementById("cartOverlay");
  const closeCartBtn = document.getElementById("closeCartBtn");

  if (cartBtn) cartBtn.addEventListener("click", openCart);
  if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);
  if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

  // Checkout form submit
  const checkoutForm = document.getElementById("checkoutForm");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", handleCheckoutSubmit);
  }
}

// CART MANAGEMENT
function openCart() {
  document.getElementById("cartDrawer").classList.add("active");
  document.getElementById("cartOverlay").classList.add("active");
  renderCart();
}

function closeCart() {
  document.getElementById("cartDrawer").classList.remove("active");
  document.getElementById("cartOverlay").classList.remove("active");
}

function addToCart(perfumeId) {
  const perfume = allPerfumes.find(p => p.id === perfumeId);
  if (!perfume) return;

  const existing = cart.find(item => item.id === perfumeId);
  if (existing) {
    existing.quantity += 1;
  } else {
    const finalPrice = perfume.sale_price ? Number(perfume.sale_price) : Number(perfume.price);
    cart.push({
      id: perfume.id,
      name: perfume.name,
      price: finalPrice,
      volume_ml: perfume.volume_ml || 50,
      image_url: perfume.image_url || "",
      category: perfume.category || "",
      quantity: 1
    });
  }

  saveCart();
  updateCartBadge();
  showToast(`Added "${perfume.name}" to cart!`);
  openCart();
}

function updateCartQty(perfumeId, delta) {
  const item = cart.find(i => i.id === perfumeId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== perfumeId);
  }

  saveCart();
  updateCartBadge();
  renderCart();
}

function removeFromCart(perfumeId) {
  cart = cart.filter(i => i.id !== perfumeId);
  saveCart();
  updateCartBadge();
  renderCart();
  showToast("Item removed from cart", "error");
}

function saveCart() {
  localStorage.setItem("bpop_cart", JSON.stringify(cart));
}

function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (!badge) return;
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.textContent = count;
}

function renderCart() {
  const container = document.getElementById("cartItemsList");
  const subtotalEl = document.getElementById("cartSubtotal");
  const shippingEl = document.getElementById("cartShipping");
  const grandTotalEl = document.getElementById("cartGrandTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <i class="fa-solid fa-basket-shopping"></i>
        <h4>Your Shopping Bag is Empty</h4>
        <p style="font-size: 0.85rem; margin-top: 5px;">Discover our artisan fragrances and add your favorite scent.</p>
      </div>
    `;
    subtotalEl.textContent = formatPKR(0);
    shippingEl.textContent = formatPKR(0);
    grandTotalEl.textContent = formatPKR(0);
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  if (checkoutBtn) checkoutBtn.disabled = false;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  // Free delivery across Pakistan if order exceeds PKR 3,000, else PKR 200
  const shipping = subtotal >= 3000 ? 0 : 200;
  const grandTotal = subtotal + shipping;

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image_url || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=150&q=80'}" class="cart-item-img" alt="${escapeHtml(item.name)}">
      <div class="cart-item-info">
        <h5 class="cart-item-title">${escapeHtml(item.name)}</h5>
        <div class="cart-item-meta">${escapeHtml(item.category)} • ${item.volume_ml}ml</div>
        <div class="cart-item-price">${formatPKR(item.price)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="updateCartQty('${item.id}', -1)">-</button>
          <span style="font-size: 0.85rem; font-weight: 600;">${item.quantity}</span>
          <button class="qty-btn" onclick="updateCartQty('${item.id}', 1)">+</button>
        </div>
      </div>
      <button class="cart-item-del" onclick="removeFromCart('${item.id}')" title="Remove">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join("");

  subtotalEl.textContent = formatPKR(subtotal);
  shippingEl.textContent = shipping === 0 ? "FREE" : formatPKR(shipping);
  grandTotalEl.textContent = formatPKR(grandTotal);
}

// QUICK VIEW MODAL
function openQuickView(perfumeId) {
  const p = allPerfumes.find(item => item.id === perfumeId);
  if (!p) return;

  const modal = document.getElementById("quickViewModal");
  const body = document.getElementById("quickViewBody");
  if (!modal || !body) return;

  const hasDiscount = p.sale_price && Number(p.sale_price) < Number(p.price);
  const displayPrice = hasDiscount ? p.sale_price : p.price;

  body.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: center;">
      <div style="background: #15171f; border-radius: 8px; overflow: hidden; height: 320px; display: flex; align-items: center; justify-content: center;">
        ${p.image_url ? `<img src="${escapeHtml(p.image_url)}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fa-solid fa-spray-can-sparkles fa-3x" style="color: var(--gold-primary);"></i>`}
      </div>
      <div>
        <span style="color: var(--gold-primary); font-size: 0.8rem; text-transform: uppercase; font-weight: 600;">${escapeHtml(p.category || 'Luxury Fragrance')}</span>
        <h2 style="font-family: var(--font-serif); font-size: 1.5rem; margin: 4px 0 8px;">${escapeHtml(p.name)}</h2>
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">Brand: ${escapeHtml(p.brand || 'Best Perfume of Pakistan')} | ${p.volume_ml}ml ${escapeHtml(p.concentration || 'Eau De Parfum')}</div>
        <div style="font-size: 1.3rem; font-weight: 700; color: var(--gold-light); margin-bottom: 16px;">${formatPKR(displayPrice)}</div>
        <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 18px;">
          ${escapeHtml(p.description || 'An exquisite, long-lasting formulation expertly distilled with the finest aromatic essences.')}
        </p>

        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px; font-size: 0.82rem; margin-bottom: 20px;">
          <div><strong style="color: var(--gold-primary);">Top Notes:</strong> ${escapeHtml(p.top_notes || 'Fresh Citrus, Bergamot')}</div>
          <div><strong style="color: var(--gold-primary);">Heart Notes:</strong> ${escapeHtml(p.heart_notes || 'Floral Bouquet, Spicy Cardamom')}</div>
          <div><strong style="color: var(--gold-primary);">Base Notes:</strong> ${escapeHtml(p.base_notes || 'Rich Oud, Amber, Musk')}</div>
        </div>

        <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="addToCart('${p.id}'); closeQuickView();">
          <i class="fa-solid fa-bag-shopping"></i> Add to Shopping Bag
        </button>
      </div>
    </div>
  `;

  modal.classList.add("active");
}

function closeQuickView() {
  const modal = document.getElementById("quickViewModal");
  if (modal) modal.classList.remove("active");
}

// CHECKOUT MODAL & ORDER CREATION
function openCheckout() {
  if (cart.length === 0) return;
  closeCart();
  const modal = document.getElementById("checkoutModal");
  if (modal) {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= 3000 ? 0 : 200;
    document.getElementById("checkoutTotalDisplay").textContent = formatPKR(subtotal + shipping);
    modal.classList.add("active");
  }
}

function closeCheckout() {
  const modal = document.getElementById("checkoutModal");
  if (modal) modal.classList.remove("active");
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const email = document.getElementById("custEmail")?.value.trim() || "";
  const city = document.getElementById("custCity").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  const payment = document.getElementById("custPayment").value;
  const notes = document.getElementById("custNotes")?.value.trim() || "";

  if (!name || !phone || !city || !address) {
    showToast("Please fill in all delivery details", "error");
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal >= 3000 ? 0 : 200;
  const grandTotal = subtotal + shipping;

  const orderData = {
    customer_name: name,
    customer_phone: phone,
    customer_email: email,
    city: city,
    address: address,
    payment_method: payment,
    order_notes: notes,
    items: cart,
    total_amount: grandTotal
  };

  const submitBtn = document.getElementById("placeOrderBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Placing Order...`;
  }

  try {
    const res = await PerfumeService.createOrder(orderData);
    if (res.success) {
      // Clear Cart
      cart = [];
      saveCart();
      updateCartBadge();
      closeCheckout();

      // Show Order Success Modal
      showOrderSuccess(res.data || orderData);
    } else {
      showToast("Order could not be saved: " + (res.message || "Unknown error"), "error");
    }
  } catch (err) {
    console.error("Order error:", err);
    showToast("Error processing order. Please try again.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Confirm & Place Order`;
    }
  }
}

function showOrderSuccess(order) {
  const modal = document.getElementById("orderSuccessModal");
  const detailsEl = document.getElementById("orderSuccessDetails");
  if (!modal || !detailsEl) return;

  const itemsSummary = (order.items || []).map(i => `${i.name} (Qty: ${i.quantity})`).join(", ");
  const whatsappMsg = encodeURIComponent(
    `Salam! I just placed an order on *Best Perfume of Pakistan*.\n` +
    `*Order ID:* ${order.id || 'N/A'}\n` +
    `*Customer:* ${order.customer_name}\n` +
    `*Phone:* ${order.customer_phone}\n` +
    `*City:* ${order.city}\n` +
    `*Items:* ${itemsSummary}\n` +
    `*Total:* PKR ${Number(order.total_amount).toLocaleString('en-PK')}\n` +
    `*Payment:* ${order.payment_method}`
  );

  detailsEl.innerHTML = `
    <div style="text-align: center; padding: 20px 0;">
      <div style="width: 70px; height: 70px; border-radius: 50%; background: rgba(46, 204, 113, 0.15); border: 2px solid #2ecc71; color: #2ecc71; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 16px;">
        <i class="fa-solid fa-check"></i>
      </div>
      <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 8px;">Order Placed Successfully!</h3>
      <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 20px;">
        Thank you for choosing Best Perfume of Pakistan. We will dispatch your package shortly.
      </p>

      <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; text-align: left; font-size: 0.85rem; margin-bottom: 24px;">
        <div><strong>Customer:</strong> ${escapeHtml(order.customer_name)}</div>
        <div><strong>Phone:</strong> ${escapeHtml(order.customer_phone)}</div>
        <div><strong>Destination:</strong> ${escapeHtml(order.address)}, ${escapeHtml(order.city)}</div>
        <div><strong>Total Payable:</strong> ${formatPKR(order.total_amount)} (${escapeHtml(order.payment_method)})</div>
      </div>

      <a href="https://wa.me/923000000000?text=${whatsappMsg}" target="_blank" class="btn-primary" style="display: inline-flex; justify-content: center; width: 100%; margin-bottom: 12px; background: #25D366; color: white;">
        <i class="fa-brands fa-whatsapp fa-lg"></i> Confirm on WhatsApp
      </a>

      <button class="btn-outline" style="width: 100%;" onclick="closeOrderSuccess()">
        Continue Shopping
      </button>
    </div>
  `;

  modal.classList.add("active");
}

function closeOrderSuccess() {
  const modal = document.getElementById("orderSuccessModal");
  if (modal) modal.classList.remove("active");
}

// Utility: Escape HTML
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
