-- Cart items (temporary during call session)
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  size TEXT,
  modifications JSONB DEFAULT '[]',
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders (permanent record after validation)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  session_id TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  order_type TEXT CHECK (order_type IN ('delivery', 'pickup')),
  items JSONB NOT NULL DEFAULT '[]',
  total_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for session lookups
CREATE INDEX idx_cart_items_session ON cart_items(session_id);
CREATE INDEX idx_orders_session ON orders(session_id);

-- Enable Realtime for cart_items
ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;

-- RLS (public access for demo - no auth required)
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Cart items: public CRUD for demo
CREATE POLICY "Public read cart" ON cart_items FOR SELECT USING (true);
CREATE POLICY "Public insert cart" ON cart_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update cart" ON cart_items FOR UPDATE USING (true);
CREATE POLICY "Public delete cart" ON cart_items FOR DELETE USING (true);

-- Orders: public read/insert for demo
CREATE POLICY "Public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update orders" ON orders FOR UPDATE USING (true);