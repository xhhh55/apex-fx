-- ══════════════════════════════════════════════════════
--  APEX INVEST — Supabase Database Schema  v2.0
--  Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════

-- ── Users ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  email               TEXT UNIQUE NOT NULL,
  password_hash       TEXT NOT NULL,
  plan                TEXT NOT NULL DEFAULT 'free',   -- free | pro | elite
  balance             NUMERIC(12,2) NOT NULL DEFAULT 10000.00,
  stripe_customer_id  TEXT,
  subscription_id     TEXT,
  bio                 TEXT,
  avatar_url          TEXT,
  notif_email         BOOLEAN DEFAULT TRUE,
  notif_push          BOOLEAN DEFAULT TRUE,
  notif_price         BOOLEAN DEFAULT TRUE,
  notif_news          BOOLEAN DEFAULT TRUE,
  notif_leaderboard   BOOLEAN DEFAULT FALSE,
  theme               TEXT DEFAULT 'gold',
  lang                TEXT DEFAULT 'ar',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Broker Accounts ───────────────────────────────────
-- Stores encrypted API credentials for each connected broker
CREATE TABLE IF NOT EXISTS broker_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker          TEXT NOT NULL,            -- oanda | alpaca | binance | metaapi | demo
  label           TEXT NOT NULL,            -- user-defined label e.g. "My OANDA Live"
  account_type    TEXT NOT NULL DEFAULT 'live',  -- live | practice | paper | demo
  -- Encrypted credential fields (AES-256 via backend before storage)
  api_key_enc     TEXT,                     -- encrypted API key / account ID
  api_secret_enc  TEXT,                     -- encrypted API secret / access token
  extra_enc       TEXT,                     -- encrypted JSON for extra params (e.g. MetaApi server)
  -- Live state (synced from broker)
  broker_balance  NUMERIC(14,2),
  broker_currency TEXT DEFAULT 'USD',
  broker_account_id TEXT,                   -- broker's own account ID / login
  is_active       BOOLEAN DEFAULT TRUE,
  last_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broker_accounts_user  ON broker_accounts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_broker_accounts_label ON broker_accounts(user_id, label);

-- ── Trades ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker_account_id UUID REFERENCES broker_accounts(id) ON DELETE SET NULL,
  pair            TEXT NOT NULL,
  action          TEXT NOT NULL CHECK (action IN ('BUY','SELL')),
  lots            NUMERIC(10,4) NOT NULL,
  entry_price     NUMERIC(16,6) NOT NULL,
  exit_price      NUMERIC(16,6),
  sl              NUMERIC(16,6),
  tp              NUMERIC(16,6),
  pl              NUMERIC(12,2),
  commission      NUMERIC(8,4) DEFAULT 0,
  swap            NUMERIC(8,4) DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','pending','cancelled')),
  -- Broker-side reference
  broker_trade_id TEXT,                     -- broker's own trade/order ID
  is_demo         BOOLEAN DEFAULT FALSE,
  opened_at       TIMESTAMPTZ DEFAULT NOW(),
  closed_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trades_user_id   ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status    ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_broker_account ON trades(broker_account_id);

-- ── Price Alerts ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pair         TEXT NOT NULL,
  price        NUMERIC(16,6) NOT NULL,
  direction    TEXT NOT NULL CHECK (direction IN ('above','below')),
  triggered    BOOLEAN DEFAULT FALSE,
  fired_price  NUMERIC(16,6),
  triggered_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id   ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered ON alerts(triggered);

-- ── Real Estate Listings ──────────────────────────────
CREATE TABLE IF NOT EXISTS real_estate_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  title_ar        TEXT,
  description     TEXT,
  description_ar  TEXT,
  listing_type    TEXT NOT NULL CHECK (listing_type IN ('sale','rent','investment','fractional')),
  property_type   TEXT NOT NULL CHECK (property_type IN ('apartment','villa','office','land','warehouse','retail','hotel')),
  -- Location
  country         TEXT NOT NULL DEFAULT 'UAE',
  city            TEXT NOT NULL,
  district        TEXT,
  address         TEXT,
  lat             NUMERIC(10,7),
  lng             NUMERIC(10,7),
  -- Financials
  price           NUMERIC(16,2),            -- sale price or total value
  currency        TEXT NOT NULL DEFAULT 'USD',
  rent_per_month  NUMERIC(12,2),            -- if rent
  service_charge  NUMERIC(8,2),             -- annual
  annual_yield    NUMERIC(5,2),             -- % net yield
  price_per_sqm   NUMERIC(10,2),
  -- Property details
  area_sqm        NUMERIC(10,2),
  bedrooms        INT,
  bathrooms       INT,
  floors          INT,
  year_built      INT,
  -- Fractional investment fields
  total_tokens    INT,
  token_price     NUMERIC(10,2),
  min_investment  NUMERIC(10,2),
  tokens_sold     INT DEFAULT 0,
  -- Status & meta
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','sold','rented','pending','inactive')),
  verified        BOOLEAN DEFAULT FALSE,
  featured        BOOLEAN DEFAULT FALSE,
  views           INT DEFAULT 0,
  images          TEXT[],                   -- array of image URLs
  amenities       TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_re_city       ON real_estate_listings(city);
CREATE INDEX IF NOT EXISTS idx_re_type       ON real_estate_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_re_status     ON real_estate_listings(status);
CREATE INDEX IF NOT EXISTS idx_re_owner      ON real_estate_listings(owner_id);

-- ── Real Estate Investments (fractional ownership) ────
CREATE TABLE IF NOT EXISTS re_investments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id   UUID NOT NULL REFERENCES real_estate_listings(id) ON DELETE CASCADE,
  tokens       INT NOT NULL CHECK (tokens > 0),
  price_paid   NUMERIC(12,2) NOT NULL,
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  status       TEXT DEFAULT 'active' CHECK (status IN ('active','sold','pending'))
);

CREATE INDEX IF NOT EXISTS idx_re_inv_user    ON re_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_re_inv_listing ON re_investments(listing_id);

-- ── Investment Products ───────────────────────────────
CREATE TABLE IF NOT EXISTS investment_products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  name_ar         TEXT,
  category        TEXT NOT NULL CHECK (category IN ('staking','savings','fixed','fund','lending')),
  token           TEXT,                     -- e.g. ETH, BNB, USDT
  apy_min         NUMERIC(5,2) NOT NULL,
  apy_max         NUMERIC(5,2),
  lock_days       INT DEFAULT 0,
  min_amount      NUMERIC(16,2) NOT NULL DEFAULT 10,
  max_amount      NUMERIC(16,2),
  currency        TEXT DEFAULT 'USD',
  tvl             NUMERIC(20,2),
  risk_level      TEXT CHECK (risk_level IN ('Low','Medium','High')),
  chain           TEXT,
  provider        TEXT,                     -- e.g. Binance Earn, Lido, Aave
  provider_url    TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── User Investment Positions ─────────────────────────
CREATE TABLE IF NOT EXISTS investment_positions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL REFERENCES investment_products(id) ON DELETE CASCADE,
  amount         NUMERIC(16,2) NOT NULL,
  apy_locked     NUMERIC(5,2) NOT NULL,
  start_date     TIMESTAMPTZ DEFAULT NOW(),
  end_date       TIMESTAMPTZ,              -- NULL = flexible
  earned         NUMERIC(12,4) DEFAULT 0,
  status         TEXT DEFAULT 'active' CHECK (status IN ('active','matured','withdrawn','cancelled')),
  auto_compound  BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_positions_user ON investment_positions(user_id);

-- ── Leaderboard ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaderboard (
  user_id   UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance   NUMERIC(12,2) DEFAULT 10000,
  trades    INT DEFAULT 0,
  win_rate  NUMERIC(5,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE VIEW leaderboard_view AS
SELECT
  u.id,
  u.name,
  u.plan,
  u.balance,
  ROUND(u.balance - 10000, 2)  AS profit,
  COUNT(t.id) FILTER (WHERE t.status = 'closed') AS trades,
  ROUND(
    COUNT(t.id) FILTER (WHERE t.status = 'closed' AND t.pl > 0)::NUMERIC /
    NULLIF(COUNT(t.id) FILTER (WHERE t.status = 'closed'), 0) * 100
  , 0) AS win_rate
FROM users u
LEFT JOIN trades t ON t.user_id = u.id
GROUP BY u.id, u.name, u.plan, u.balance
ORDER BY u.balance DESC;

-- ── Holdings (long-term asset positions) ──────────────
CREATE TABLE IF NOT EXISTS holdings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset       TEXT NOT NULL,
  asset_type  TEXT NOT NULL CHECK (asset_type IN ('crypto','stock','realestate','forex','commodity')),
  quantity    NUMERIC(20,8) NOT NULL CHECK (quantity > 0),
  avg_price   NUMERIC(16,6) NOT NULL CHECK (avg_price > 0),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_holdings_user_asset ON holdings(user_id, asset);

-- ── Trading Journal ────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trade_id    UUID REFERENCES trades(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  mood        TEXT CHECK (mood IN ('confident','neutral','anxious','greedy','fearful')),
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_user_id ON journal(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_mood    ON journal(mood);

-- ── Affiliates & Referrals ─────────────────────────────
CREATE TABLE IF NOT EXISTS affiliates (
  user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  code             TEXT UNIQUE NOT NULL,
  total_referrals  INT DEFAULT 0,
  total_earnings   NUMERIC(10,2) DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  commission   NUMERIC(8,2) DEFAULT 0,
  paid         BOOLEAN DEFAULT FALSE,
  paid_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- ── Row Level Security (RLS) ──────────────────────────
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades              ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal             ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_estate_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE re_investments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_positions ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (backend uses service_role key)
CREATE POLICY "service_bypass_users"     ON users               USING (true) WITH CHECK (true);
CREATE POLICY "service_bypass_brokers"   ON broker_accounts     USING (true) WITH CHECK (true);
CREATE POLICY "service_bypass_trades"    ON trades              USING (true) WITH CHECK (true);
CREATE POLICY "service_bypass_alerts"    ON alerts              USING (true) WITH CHECK (true);
CREATE POLICY "service_bypass_holdings"  ON holdings            USING (true) WITH CHECK (true);
CREATE POLICY "service_bypass_journal"   ON journal             USING (true) WITH CHECK (true);
CREATE POLICY "service_bypass_affiliates" ON affiliates         USING (true) WITH CHECK (true);
CREATE POLICY "service_bypass_referrals" ON referrals           USING (true) WITH CHECK (true);
CREATE POLICY "service_bypass_re"        ON real_estate_listings USING (true) WITH CHECK (true);
CREATE POLICY "service_bypass_re_inv"    ON re_investments       USING (true) WITH CHECK (true);
CREATE POLICY "service_bypass_inv_pos"   ON investment_positions USING (true) WITH CHECK (true);

-- ── Seed: Default investment products ─────────────────
INSERT INTO investment_products (name, name_ar, category, token, apy_min, apy_max, lock_days, min_amount, currency, tvl, risk_level, chain, provider, provider_url) VALUES
('Ethereum 2.0 Staking', 'ستاكينج إيثيريوم 2.0', 'staking', 'ETH',  3.5,  4.2,  0,   0.01, 'ETH', 28400000000,  'Low',    'Ethereum',   'Lido Finance',   'https://lido.fi'),
('BNB 30-Day Savings',   'توفير BNB 30 يوم',    'savings', 'BNB',  5.8,  6.5,  30,  1,    'BNB', 4200000000,   'Low',    'BNB Chain',  'Binance Earn',   'https://binance.com/en/earn'),
('Solana Staking',       'ستاكينج سولانا',      'staking', 'SOL',  6.5,  7.5,  0,   1,    'SOL', 12100000000,  'Low',    'Solana',     'Marinade',       'https://marinade.finance'),
('Cosmos Hub Staking',   'ستاكينج كوزموس',      'staking', 'ATOM', 16.0, 20.0, 21,  5,    'ATOM',2800000000,   'Medium', 'Cosmos',     'Cosmos Hub',     'https://cosmos.network'),
('Polkadot Staking',     'ستاكينج بولكادوت',    'staking', 'DOT',  11.0, 13.5, 28,  10,   'DOT', 7900000000,   'Medium', 'Polkadot',   'Polkadot',       'https://polkadot.network'),
('Avalanche Staking',    'ستاكينج أفالانش',     'staking', 'AVAX', 7.5,  9.0,  0,   25,   'AVAX',2100000000,   'Medium', 'Avalanche',  'Avalanche',      'https://avax.network'),
('USDT Flexible Earn',   'توفير USDT مرن',      'savings', 'USDT', 4.5,  5.5,  0,   10,   'USD', 45000000000,  'Low',    'Multi-chain','Aave',           'https://aave.com'),
('USDC 30-Day Fixed',    'توفير USDC ثابت 30 يوم','fixed', 'USDC', 7.0,  8.5,  30,  100,  'USD', 18300000000,  'Low',    'Multi-chain','Compound',       'https://compound.finance'),
('BTC Flexible Savings', 'توفير BTC مرن',       'savings', 'BTC',  2.5,  3.2,  0,   0.001,'BTC', 95000000000,  'Low',    'Bitcoin',    'Binance Earn',   'https://binance.com/en/earn'),
('DeFi Lending Pool',    'مجمع إقراض DeFi',     'lending', 'USDT', 8.0,  12.0, 0,   100,  'USD', 5600000000,   'Medium', 'Ethereum',   'Curve Finance',  'https://curve.fi')
ON CONFLICT DO NOTHING;
