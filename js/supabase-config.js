/**
 * Best Perfume of Pakistan - Supabase Client Configuration
 * Uses official @supabase/supabase-js
 */

const SUPABASE_CONFIG = {
  url: "https://xlfkvgemkucqgztyoueb.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZmt2Z2Vta3VjcWd6dHlvdWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMzMxMjMsImV4cCI6MjEwNzkwOTEyM30.KivlfxEeyX8dvcm22uD70frdj05RkmwJq3DW2Ni9388",
  publishableKey: "sb_publishable_Fwj6LoMJJ6U0BMcYrcibYQ_wBlDWhq0"
};

// Initialize Supabase Client
let sbClient = null;
try {
  if (window.supabase) {
    sbClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log("💎 Supabase client initialized for 'Best Perfume of Pakistan'");
  } else {
    console.warn("⚠️ Supabase CDN not loaded yet. Waiting...");
  }
} catch (e) {
  console.error("Error creating Supabase client:", e);
}

// Global Storage for Offline/Local sync fallback
const LOCAL_STORAGE_PERFUMES_KEY = "bpop_perfumes_cache";
const LOCAL_STORAGE_ORDERS_KEY = "bpop_orders_cache";

/**
 * Service to manage Perfumes & Orders with Supabase & graceful fallback
 */
const PerfumeService = {
  // Test connection to Supabase perfumes table
  async testConnection() {
    if (!sbClient) return { success: false, message: "Supabase client not loaded" };
    try {
      const { data, error } = await sbClient.from("perfumes").select("id").limit(1);
      if (error) {
        if (error.code === "PGRST205" || error.message?.includes("schema cache")) {
          return {
            success: false,
            tableMissing: true,
            message: "Table 'perfumes' is not created in Supabase yet. Please run the SQL in Supabase SQL editor."
          };
        }
        return { success: false, message: error.message };
      }
      return { success: true, message: "Connected to Supabase successfully!" };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // Fetch all active perfumes (zero hardcoded products, strictly user added)
  async getPerfumes(filters = {}) {
    // Attempt Supabase fetch
    if (sbClient) {
      try {
        let query = sbClient.from("perfumes").select("*").order("created_at", { ascending: false });
        
        if (filters.category && filters.category !== "All") {
          query = query.eq("category", filters.category);
        }
        if (filters.gender && filters.gender !== "All") {
          query = query.eq("gender", filters.gender);
        }
        if (filters.featuredOnly) {
          query = query.eq("is_featured", true);
        }

        const { data, error } = await query;
        if (!error && data) {
          // Sync to cache
          localStorage.setItem(LOCAL_STORAGE_PERFUMES_KEY, JSON.stringify(data));
          return { data, source: "supabase" };
        } else if (error && (error.code === "PGRST205" || error.message?.includes("schema cache"))) {
          console.warn("Table not found in Supabase. Using local storage until SQL is executed.");
          const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PERFUMES_KEY) || "[]");
          return { data: localData, source: "local", needsSchema: true };
        }
      } catch (e) {
        console.error("Supabase fetch failed:", e);
      }
    }

    // Fallback to local
    const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PERFUMES_KEY) || "[]");
    return { data: localData, source: "local" };
  },

  // Get single perfume by ID
  async getPerfumeById(id) {
    if (sbClient) {
      try {
        const { data, error } = await sbClient.from("perfumes").select("*").eq("id", id).single();
        if (!error && data) return data;
      } catch (e) {
        console.warn(e);
      }
    }
    const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PERFUMES_KEY) || "[]");
    return localData.find(p => p.id === id) || null;
  },

  // Add a new perfume (Admin)
  async addPerfume(perfumeData) {
    perfumeData.created_at = new Date().toISOString();
    
    // Always store in local cache first
    const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PERFUMES_KEY) || "[]");
    const localItem = { ...perfumeData, id: perfumeData.id || crypto.randomUUID() };
    localData.unshift(localItem);
    localStorage.setItem(LOCAL_STORAGE_PERFUMES_KEY, JSON.stringify(localData));

    if (sbClient) {
      try {
        // Strip temporary fields if any
        const { data, error } = await sbClient.from("perfumes").insert([perfumeData]).select().single();
        if (!error && data) {
          // Update local cache with exact Supabase generated ID
          const updatedLocal = localData.map(p => p.id === localItem.id ? data : p);
          localStorage.setItem(LOCAL_STORAGE_PERFUMES_KEY, JSON.stringify(updatedLocal));
          return { success: true, data, source: "supabase" };
        } else if (error) {
          console.warn("Supabase insert error:", error);
          return { success: true, data: localItem, source: "local", warning: error.message };
        }
      } catch (err) {
        console.error("Add perfume failed on Supabase:", err);
      }
    }

    return { success: true, data: localItem, source: "local" };
  },

  // Update perfume (Admin)
  async updatePerfume(id, perfumeData) {
    // Update local cache
    const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PERFUMES_KEY) || "[]");
    const index = localData.findIndex(p => p.id === id);
    if (index !== -1) {
      localData[index] = { ...localData[index], ...perfumeData };
      localStorage.setItem(LOCAL_STORAGE_PERFUMES_KEY, JSON.stringify(localData));
    }

    if (sbClient) {
      try {
        const { data, error } = await sbClient.from("perfumes").update(perfumeData).eq("id", id).select().single();
        if (!error) return { success: true, data, source: "supabase" };
      } catch (err) {
        console.error("Update failed on Supabase:", err);
      }
    }
    return { success: true, data: localData[index], source: "local" };
  },

  // Delete perfume (Admin)
  async deletePerfume(id) {
    // Update local cache
    const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PERFUMES_KEY) || "[]");
    const filtered = localData.filter(p => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_PERFUMES_KEY, JSON.stringify(filtered));

    if (sbClient) {
      try {
        const { error } = await sbClient.from("perfumes").delete().eq("id", id);
        if (!error) return { success: true, source: "supabase" };
      } catch (err) {
        console.error("Delete failed on Supabase:", err);
      }
    }
    return { success: true, source: "local" };
  },

  // Place customer order
  async createOrder(orderData) {
    orderData.created_at = new Date().toISOString();
    orderData.status = "Pending";

    const localOrders = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY) || "[]");
    const orderWithId = { ...orderData, id: crypto.randomUUID() };
    localOrders.unshift(orderWithId);
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(localOrders));

    if (sbClient) {
      try {
        const { data, error } = await sbClient.from("orders").insert([orderData]).select().single();
        if (!error && data) {
          return { success: true, data, source: "supabase" };
        }
      } catch (e) {
        console.error("Order Supabase insert error:", e);
      }
    }
    return { success: true, data: orderWithId, source: "local" };
  },

  // Get all orders (Admin)
  async getOrders() {
    if (sbClient) {
      try {
        const { data, error } = await sbClient.from("orders").select("*").order("created_at", { ascending: false });
        if (!error && data) {
          localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(data));
          return { data, source: "supabase" };
        }
      } catch (e) {
        console.error("Supabase getOrders error:", e);
      }
    }
    const localOrders = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY) || "[]");
    return { data: localOrders, source: "local" };
  },

  // Update order status (Admin)
  async updateOrderStatus(id, status) {
    const localOrders = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY) || "[]");
    const idx = localOrders.findIndex(o => o.id === id);
    if (idx !== -1) {
      localOrders[idx].status = status;
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(localOrders));
    }

    if (sbClient) {
      try {
        const { data, error } = await sbClient.from("orders").update({ status }).eq("id", id).select().single();
        if (!error) return { success: true, data };
      } catch (e) {
        console.error(e);
      }
    }
    return { success: true };
  }
};

window.PerfumeService = PerfumeService;
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
