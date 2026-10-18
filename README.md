# 🇵🇰 Best Perfume of Pakistan (Haute Parfumerie)

A luxury, high-performance Perfume E-Commerce Storefront and Modern Advanced Admin Management Suite built with **HTML5, CSS3, Vanilla JavaScript, and Supabase Backend**.

---

## 🌟 Key Features

### 🛍️ Customer Storefront (`index.html`)
- **Royal Luxury Aesthetic:** Dark obsidian obsidian and imperial gold palette designed for premium fragrance connoisseurs.
- **Dynamic Catalog:** Live synchronization with Supabase `perfumes` database.
- **Zero Dummy Products:** Purely clean initialization that strictly populates only when real perfumes are added via the Admin Panel.
- **Olfactory Filters:** Instant filtration by category (Oud & Oriental, Woody & Spicy, Floral & Fresh, Luxury Attar, Amber & Musk, Citrus & Aquatic) and Gender (Men, Women, Unisex).
- **Interactive Cart & Pakistani Rupee (PKR):** Automatic delivery fee waiver for orders exceeding PKR 3,000.
- **Pakistan Nationwide Checkout:** Seamless checkout supporting Cash on Delivery (COD), JazzCash / Easypaisa, and Bank Transfer across Karachi, Lahore, Islamabad, and all cities.
- **Instant WhatsApp Confirmation:** Connects customers directly with your business WhatsApp.

### 🛡️ Modern Advanced Admin Panel (`admin.html`)
- **Live Supabase Health Indicator:** Real-time ping to verify database status.
- **Executive Dashboard:** Live metrics for Total Perfumes, Featured Items, Low Stock Warnings, Orders Placed, and Total Revenue (PKR).
- **Full CRUD Management:**
  - Add New Perfume
  - Edit Fragrance Specifications
  - Delete Fragrance
  - Scent Notes Configuration (Top, Heart, Base Notes)
  - Image URL or Direct File Upload with Live Preview
  - Volume (ml), Concentration, and Featured Toggles
- **Orders & Inquiries Management:** Review orders, update dispatch statuses (Pending, Confirmed, Shipped, Delivered), and 1-click WhatsApp customer chat.
- **Database & SQL Suite:** 1-click SQL copy and connectivity tester.

---

## 🚀 Supabase Setup (30 Seconds)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project (`xlfkvgemkucqgztyoueb`).
3. Click on **SQL Editor** on the left menu.
4. Click **New Query**, paste the code from [`supabase_schema.sql`](file:///c:/Users/Admin/Desktop/best-perfume-of-pakistan/supabase_schema.sql), and click **Run**.
5. Your `perfumes` and `orders` tables are now ready with full Row-Level Security!

---

## 📂 File Architecture

```
best-perfume-of-pakistan/
├── index.html              # Luxury customer-facing storefront
├── admin.html              # Modern advanced admin panel
├── supabase_schema.sql     # Ready-to-run Supabase PostgreSQL schema
├── README.md               # Documentation & setup guide
├── css/
│   ├── style.css           # Storefront luxury styles
│   └── admin.css           # Modern admin panel styles
└── js/
    ├── supabase-config.js  # Supabase client & unified data service
    ├── app.js              # Storefront interactions & cart logic
    └── admin.js            # Admin panel CRUD & order workflows
```

---

## 🔑 Configured Supabase Credentials
- **Project URL:** `https://xlfkvgemkucqgztyoueb.supabase.co`
- **Publishable Key:** `sb_publishable_Fwj6LoMJJ6U0BMcYrcibYQ_wBlDWhq0`
- **Anon JWT:** Configured inside `js/supabase-config.js`
