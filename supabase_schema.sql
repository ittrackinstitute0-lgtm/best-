-- ====================================================================
-- BEST PERFUME OF PAKISTAN - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase Project -> SQL Editor -> Click 'Run'
-- ====================================================================

-- 1. Create Perfumes Table
CREATE TABLE IF NOT EXISTS public.perfumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT DEFAULT 'Best Perfume of Pakistan',
    category TEXT NOT NULL,
    gender TEXT DEFAULT 'Unisex',
    price NUMERIC NOT NULL,
    sale_price NUMERIC,
    volume_ml INTEGER DEFAULT 50,
    concentration TEXT DEFAULT 'Eau De Parfum',
    top_notes TEXT,
    heart_notes TEXT,
    base_notes TEXT,
    description TEXT,
    image_url TEXT,
    stock_quantity INTEGER DEFAULT 15,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    payment_method TEXT DEFAULT 'Cash on Delivery (COD)',
    order_notes TEXT,
    items JSONB NOT NULL,
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.perfumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Perfumes (Allow public reading, inserting, updating, and deleting)
DROP POLICY IF EXISTS "Allow public read access on perfumes" ON public.perfumes;
CREATE POLICY "Allow public read access on perfumes" 
ON public.perfumes FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow anon insert access on perfumes" ON public.perfumes;
CREATE POLICY "Allow anon insert access on perfumes" 
ON public.perfumes FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update access on perfumes" ON public.perfumes;
CREATE POLICY "Allow anon update access on perfumes" 
ON public.perfumes FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Allow anon delete access on perfumes" ON public.perfumes;
CREATE POLICY "Allow anon delete access on perfumes" 
ON public.perfumes FOR DELETE 
USING (true);

-- 5. Policies for Orders (Allow customers to place orders and admin to manage)
DROP POLICY IF EXISTS "Allow anon insert on orders" ON public.orders;
CREATE POLICY "Allow anon insert on orders" 
ON public.orders FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read on orders" ON public.orders;
CREATE POLICY "Allow anon read on orders" 
ON public.orders FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow anon update on orders" ON public.orders;
CREATE POLICY "Allow anon update on orders" 
ON public.orders FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Allow anon delete on orders" ON public.orders;
CREATE POLICY "Allow anon delete on orders" 
ON public.orders FOR DELETE 
USING (true);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_perfumes_category ON public.perfumes(category);
CREATE INDEX IF NOT EXISTS idx_perfumes_featured ON public.perfumes(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
