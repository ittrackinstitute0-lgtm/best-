/**
 * Best Perfume of Pakistan - Modern Advanced Admin Panel Logic
 * Powered by Supabase Backend
 */

// State
let perfumesList = [];
let ordersList = [];
let editingPerfumeId = null;
let currentTab = "dashboard";
let perfumeSearchQuery = "";
let perfumeCategoryFilter = "All";
let perfumeGenderFilter = "All";

// PKR Formatter
function formatPKR(val) {
  return "PKR " + Number(val || 0).toLocaleString("en-PK");
}

// Toast
function showAdminToast(msg, type = "success") {
  const container = document.getElementById("adminToastContainer");
  if (!container) return;
  const t = document.createElement("div");
  t.className = "toast";
  const icon = type === "success" ? "fa-circle-check" : "fa-circle-exclamation";
  t.innerHTML = `<i class="fa-solid ${icon}" style="color: ${type === 'success' ? '#10b981' : '#ef4444'}"></i> <span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 400);
  }, 3500);
}

// Initialize Admin
document.addEventListener("DOMContentLoaded", async () => {
  setupAdminNav();
  setupImagePreviewHandler();
  setupPerfumeForm();
  
  await checkSupabaseStatus();
  await refreshAllData();
});

// Check Supabase Connectivity
async function checkSupabaseStatus() {
  const pill = document.getElementById("supabaseStatusPill");
  const testResultEl = document.getElementById("dbTestResult");

  if (!pill) return;

  pill.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Checking Supabase...`;
  pill.className = "supabase-status-pill";

  const res = await PerfumeService.testConnection();

  if (res.success) {
    pill.innerHTML = `<i class="fa-solid fa-circle-check"></i> Supabase Live`;
    pill.className = "supabase-status-pill";
    if (testResultEl) {
      testResultEl.innerHTML = `<div style="color: #10b981; margin-top: 8px;"><i class="fa-solid fa-check"></i> Connection verified! Supabase database is active and reachable.</div>`;
    }
  } else {
    pill.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> SQL Setup Needed`;
    pill.className = "supabase-status-pill warning";
    if (testResultEl) {
      testResultEl.innerHTML = `
        <div style="color: #f59e0b; margin-top: 8px;">
          <i class="fa-solid fa-triangle-exclamation"></i> ${res.message}
          <div style="font-size: 0.8rem; margin-top: 4px; color: var(--text-muted);">
            Switch to the <strong>"Database & SQL"</strong> tab and run the provided SQL in your Supabase dashboard.
          </div>
        </div>
      `;
    }
  }
}

// Refresh all data
async function refreshAllData() {
  await Promise.all([loadPerfumesAdmin(), loadOrdersAdmin()]);
  updateDashboardMetrics();
}

// Navigation between tabs
function setupAdminNav() {
  const items = document.querySelectorAll(".nav-item[data-tab]");
  items.forEach(item => {
    item.addEventListener("click", () => {
      items.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      const target = item.dataset.tab;
      currentTab = target;

      document.querySelectorAll(".tab-panel").forEach(panel => {
        panel.classList.remove("active");
      });
      const panel = document.getElementById(`panel-${target}`);
      if (panel) panel.classList.add("active");

      const titleMap = {
        dashboard: "Dashboard Overview",
        perfumes: "Perfumes Inventory Management",
        orders: "Customer Orders & Inquiries",
        database: "Supabase Database & API Settings"
      };
      document.getElementById("pageTitle").textContent = titleMap[target] || "Admin Panel";
    });
  });
}

// Dashboard Metrics
function updateDashboardMetrics() {
  // Total perfumes
  document.getElementById("metricTotalPerfumes").textContent = perfumesList.length;

  // Featured count
  const featured = perfumesList.filter(p => p.is_featured).length;
  document.getElementById("metricFeatured").textContent = featured;

  // Low stock (< 5)
  const lowStock = perfumesList.filter(p => Number(p.stock_quantity) < 5).length;
  document.getElementById("metricLowStock").textContent = lowStock;

  // Orders count
  document.getElementById("metricTotalOrders").textContent = ordersList.length;

  // Revenue
  const totalRev = ordersList.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  document.getElementById("metricTotalRevenue").textContent = formatPKR(totalRev);

  // Recent tables on dashboard
  renderRecentPerfumes();
  renderRecentOrders();
}

function renderRecentPerfumes() {
  const container = document.getElementById("recentPerfumesList");
  if (!container) return;

  if (perfumesList.length === 0) {
    container.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 30px;">No perfumes in database. Click "+ Add New Perfume" to add your first product.</td></tr>`;
    return;
  }

  const recent = perfumesList.slice(0, 5);
  container.innerHTML = recent.map(p => `
    <tr>
      <td>
        <div class="perfume-cell">
          <div class="table-img">
            ${p.image_url ? `<img src="${p.image_url}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">` : `<i class="fa-solid fa-spray-can-sparkles"></i>`}
          </div>
          <div>
            <div class="perfume-name-title">${escapeHtml(p.name)}</div>
            <div class="perfume-name-sub">${escapeHtml(p.category)} &bull; ${p.volume_ml}ml</div>
          </div>
        </div>
      </td>
      <td><strong>${formatPKR(p.price)}</strong></td>
      <td>
        <span class="badge-status ${Number(p.stock_quantity) > 5 ? 'badge-instock' : (Number(p.stock_quantity) > 0 ? 'badge-lowstock' : 'badge-outofstock')}">
          ${p.stock_quantity} in stock
        </span>
      </td>
      <td>
        <button class="btn-icon-admin" onclick="openEditPerfumeModal('${p.id}')" title="Edit">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

function renderRecentOrders() {
  const container = document.getElementById("recentOrdersList");
  if (!container) return;

  if (ordersList.length === 0) {
    container.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">No customer orders placed yet. Orders from website will appear here in real-time.</td></tr>`;
    return;
  }

  const recent = ordersList.slice(0, 5);
  container.innerHTML = recent.map(o => `
    <tr>
      <td><strong>${escapeHtml(o.customer_name)}</strong><br><span style="font-size:0.75rem; color: var(--text-muted);">${escapeHtml(o.customer_phone)}</span></td>
      <td>${escapeHtml(o.city)}</td>
      <td>${formatPKR(o.total_amount)}</td>
      <td><span class="badge-status badge-instock">${escapeHtml(o.status || 'Pending')}</span></td>
      <td>
        <a href="https://wa.me/92${o.customer_phone.replace(/^0/, '')}" target="_blank" class="btn-icon-admin" title="Message Customer on WhatsApp">
          <i class="fa-brands fa-whatsapp"></i>
        </a>
      </td>
    </tr>
  `).join("");
}

// PERFUMES MANAGEMENT (CRUD)
async function loadPerfumesAdmin() {
  const res = await PerfumeService.getPerfumes();
  perfumesList = res.data || [];
  renderPerfumesTable();
}

function renderPerfumesTable() {
  const tbody = document.getElementById("perfumesTableBody");
  if (!tbody) return;

  // Filter
  const filtered = perfumesList.filter(p => {
    const matchCat = perfumeCategoryFilter === "All" || p.category === perfumeCategoryFilter;
    const matchGen = perfumeGenderFilter === "All" || p.gender === perfumeGenderFilter;
    const q = perfumeSearchQuery.toLowerCase();
    const matchSearch = !q || (p.name || "").toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q);
    return matchCat && matchGen && matchSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 50px 20px; color: var(--text-muted);">
          <i class="fa-solid fa-box-open fa-2x" style="margin-bottom: 10px; display: block; color: var(--gold-primary);"></i>
          ${perfumesList.length === 0 ? 'No perfumes added yet. Click "+ Add New Perfume" to create your first fragrance!' : 'No perfumes match your search/filter criteria.'}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const hasDiscount = p.sale_price && Number(p.sale_price) < Number(p.price);
    const stockNum = Number(p.stock_quantity || 0);

    return `
      <tr>
        <td>
          <div class="perfume-cell">
            <div class="table-img">
              ${p.image_url ? `<img src="${escapeHtml(p.image_url)}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" onerror="this.outerHTML='<i class=\\'fa-solid fa-spray-can-sparkles\\'></i>'">` : `<i class="fa-solid fa-spray-can-sparkles"></i>`}
            </div>
            <div>
              <div class="perfume-name-title">${escapeHtml(p.name)}</div>
              <div class="perfume-name-sub">${escapeHtml(p.brand || 'Best Perfume of Pakistan')} &bull; ${escapeHtml(p.concentration || 'EDP')}</div>
            </div>
          </div>
        </td>
        <td>${escapeHtml(p.category)}</td>
        <td>${escapeHtml(p.gender || 'Unisex')} (${p.volume_ml || 50}ml)</td>
        <td>
          <strong>${formatPKR(p.sale_price || p.price)}</strong>
          ${hasDiscount ? `<br><span style="text-decoration:line-through; font-size:0.75rem; color:var(--text-muted);">${formatPKR(p.price)}</span>` : ''}
        </td>
        <td>
          <span class="badge-status ${stockNum > 5 ? 'badge-instock' : (stockNum > 0 ? 'badge-lowstock' : 'badge-outofstock')}">
            ${stockNum} in stock
          </span>
        </td>
        <td>
          ${p.is_featured ? `<span class="badge-status badge-featured"><i class="fa-solid fa-crown"></i> Featured</span>` : `<span style="color:var(--text-muted); font-size:0.8rem;">Standard</span>`}
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-icon-admin" title="Edit" onclick="openEditPerfumeModal('${p.id}')">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-icon-admin delete" title="Delete" onclick="deletePerfumeConfirm('${p.id}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// Search and filter triggers
function filterPerfumesAdmin() {
  const searchInput = document.getElementById("adminPerfumeSearch");
  if (searchInput) perfumeSearchQuery = searchInput.value.trim();

  const catSelect = document.getElementById("adminCategoryFilter");
  if (catSelect) perfumeCategoryFilter = catSelect.value;

  const genSelect = document.getElementById("adminGenderFilter");
  if (genSelect) perfumeGenderFilter = genSelect.value;

  renderPerfumesTable();
}

// Modal open/close
function openAddPerfumeModal() {
  editingPerfumeId = null;
  document.getElementById("perfumeModalTitle").innerHTML = `<i class="fa-solid fa-plus-circle"></i> Add New Perfume`;
  document.getElementById("perfumeForm").reset();
  document.getElementById("perfumeIdField").value = "";
  
  const preview = document.getElementById("imagePreviewBox");
  preview.innerHTML = `<span style="color: var(--text-muted); font-size: 0.82rem;">Image preview will appear here</span>`;
  
  document.getElementById("perfumeModal").classList.add("active");
}

function openEditPerfumeModal(id) {
  const p = perfumesList.find(item => item.id === id);
  if (!p) return;

  editingPerfumeId = id;
  document.getElementById("perfumeModalTitle").innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Perfume`;
  
  document.getElementById("perfumeIdField").value = p.id;
  document.getElementById("perfumeName").value = p.name || "";
  document.getElementById("perfumeBrand").value = p.brand || "Best Perfume of Pakistan";
  document.getElementById("perfumeCategory").value = p.category || "Oud & Oriental";
  document.getElementById("perfumeGender").value = p.gender || "Unisex";
  document.getElementById("perfumeConcentration").value = p.concentration || "Eau De Parfum";
  document.getElementById("perfumeVolume").value = p.volume_ml || 50;
  document.getElementById("perfumePrice").value = p.price || "";
  document.getElementById("perfumeSalePrice").value = p.sale_price || "";
  document.getElementById("perfumeStock").value = p.stock_quantity ?? 15;
  document.getElementById("perfumeTopNotes").value = p.top_notes || "";
  document.getElementById("perfumeHeartNotes").value = p.heart_notes || "";
  document.getElementById("perfumeBaseNotes").value = p.base_notes || "";
  document.getElementById("perfumeDescription").value = p.description || "";
  document.getElementById("perfumeImageUrl").value = p.image_url || "";
  document.getElementById("perfumeFeatured").checked = Boolean(p.is_featured);

  const preview = document.getElementById("imagePreviewBox");
  if (p.image_url) {
    preview.innerHTML = `<img src="${p.image_url}" alt="Preview">`;
  } else {
    preview.innerHTML = `<span style="color: var(--text-muted); font-size: 0.82rem;">No image specified</span>`;
  }

  document.getElementById("perfumeModal").classList.add("active");
}

function closePerfumeModal() {
  document.getElementById("perfumeModal").classList.remove("active");
}

// Image preview handler
function setupImagePreviewHandler() {
  const urlInput = document.getElementById("perfumeImageUrl");
  const fileInput = document.getElementById("perfumeImageFile");
  const preview = document.getElementById("imagePreviewBox");

  if (urlInput) {
    urlInput.addEventListener("input", () => {
      const val = urlInput.value.trim();
      if (val) {
        preview.innerHTML = `<img src="${val}" onerror="this.parentElement.innerHTML='<span style=\\'color:#ef4444;\\'>Failed to load image</span>'">`;
      } else {
        preview.innerHTML = `<span style="color: var(--text-muted); font-size: 0.82rem;">Image preview will appear here</span>`;
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          urlInput.value = event.target.result;
          preview.innerHTML = `<img src="${event.target.result}">`;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// Submit Add / Edit Form
function setupPerfumeForm() {
  const form = document.getElementById("perfumeForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("perfumeName").value.trim();
    const brand = document.getElementById("perfumeBrand").value.trim();
    const category = document.getElementById("perfumeCategory").value;
    const gender = document.getElementById("perfumeGender").value;
    const concentration = document.getElementById("perfumeConcentration").value;
    const volume_ml = parseInt(document.getElementById("perfumeVolume").value, 10) || 50;
    const price = parseFloat(document.getElementById("perfumePrice").value) || 0;
    const sale_price_val = document.getElementById("perfumeSalePrice").value.trim();
    const sale_price = sale_price_val ? parseFloat(sale_price_val) : null;
    const stock_quantity = parseInt(document.getElementById("perfumeStock").value, 10) || 0;
    const top_notes = document.getElementById("perfumeTopNotes").value.trim();
    const heart_notes = document.getElementById("perfumeHeartNotes").value.trim();
    const base_notes = document.getElementById("perfumeBaseNotes").value.trim();
    const description = document.getElementById("perfumeDescription").value.trim();
    const image_url = document.getElementById("perfumeImageUrl").value.trim();
    const is_featured = document.getElementById("perfumeFeatured").checked;

    if (!name || !price) {
      showAdminToast("Please provide at least a perfume name and price", "error");
      return;
    }

    const payload = {
      name,
      brand,
      category,
      gender,
      concentration,
      volume_ml,
      price,
      sale_price,
      stock_quantity,
      top_notes,
      heart_notes,
      base_notes,
      description,
      image_url,
      is_featured,
      is_active: true
    };

    const submitBtn = document.getElementById("savePerfumeBtn");
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving to Supabase...`;

    try {
      if (editingPerfumeId) {
        // Update
        const res = await PerfumeService.updatePerfume(editingPerfumeId, payload);
        if (res.success) {
          showAdminToast(`Updated "${name}" successfully!`);
        }
      } else {
        // Add
        const res = await PerfumeService.addPerfume(payload);
        if (res.success) {
          showAdminToast(`Added "${name}" to collection!`);
        }
      }

      closePerfumeModal();
      await refreshAllData();
    } catch (err) {
      console.error(err);
      showAdminToast("Error saving perfume: " + err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Save Fragrance`;
    }
  });
}

// Delete Perfume
async function deletePerfumeConfirm(id) {
  const p = perfumesList.find(i => i.id === id);
  if (!confirm(`Are you sure you want to delete "${p?.name || 'this perfume'}"? This cannot be undone.`)) {
    return;
  }

  const res = await PerfumeService.deletePerfume(id);
  if (res.success) {
    showAdminToast("Perfume deleted successfully!");
    await refreshAllData();
  } else {
    showAdminToast("Could not delete perfume", "error");
  }
}

// ORDERS MANAGEMENT
async function loadOrdersAdmin() {
  const res = await PerfumeService.getOrders();
  ordersList = res.data || [];
  renderOrdersTable();
}

function renderOrdersTable() {
  const tbody = document.getElementById("ordersTableBody");
  if (!tbody) return;

  if (ordersList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 50px 20px; color: var(--text-muted);">
          <i class="fa-solid fa-inbox fa-2x" style="margin-bottom: 10px; display: block; color: var(--gold-primary);"></i>
          No orders received yet. When visitors place orders on the website, they will appear here.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = ordersList.map(o => {
    const itemsFormatted = (o.items || []).map(i => `${escapeHtml(i.name)} &times; ${i.quantity}`).join("<br>");
    const waPhone = "92" + (o.customer_phone || "").replace(/[^0-9]/g, "").replace(/^0/, "");
    const dateFormatted = o.created_at ? new Date(o.created_at).toLocaleDateString("en-PK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recently";

    return `
      <tr>
        <td>
          <strong>${escapeHtml(o.customer_name)}</strong><br>
          <span style="font-size:0.75rem; color:var(--text-muted);">${dateFormatted}</span>
        </td>
        <td>
          <a href="tel:${escapeHtml(o.customer_phone)}" style="color:var(--gold-light);">${escapeHtml(o.customer_phone)}</a><br>
          <a href="https://wa.me/${waPhone}" target="_blank" style="color:#25D366; font-size:0.78rem; font-weight:600;">
            <i class="fa-brands fa-whatsapp"></i> Chat on WhatsApp
          </a>
        </td>
        <td>
          <strong>${escapeHtml(o.city)}</strong><br>
          <span style="font-size:0.78rem; color:var(--text-muted);">${escapeHtml(o.address)}</span>
        </td>
        <td style="font-size:0.82rem;">${itemsFormatted || 'N/A'}</td>
        <td><strong>${formatPKR(o.total_amount)}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(o.payment_method)}</span></td>
        <td>
          <select class="select-admin" onchange="changeOrderStatus('${o.id}', this.value)" style="padding: 5px 8px; font-size: 0.8rem;">
            <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
      </tr>
    `;
  }).join("");
}

async function changeOrderStatus(id, newStatus) {
  const res = await PerfumeService.updateOrderStatus(id, newStatus);
  if (res.success) {
    showAdminToast(`Order status updated to "${newStatus}"`);
    await loadOrdersAdmin();
    updateDashboardMetrics();
  }
}

// Copy SQL Schema to clipboard
function copySqlSchema() {
  const sql = document.getElementById("sqlSchemaCode").textContent;
  navigator.clipboard.writeText(sql).then(() => {
    showAdminToast("SQL Schema copied to clipboard! Paste in Supabase SQL Editor.");
  }).catch(() => {
    showAdminToast("Could not copy automatically. Please select text manually.", "error");
  });
}

// Escape HTML utility
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
