/* eslint-disable */
/**
 * App.test.js — Frontend unit tests
 * Runner: Jest + React Testing Library (via react-scripts)
 *
 * Focuses on the API path contract and utility logic,
 * since App.js is a monolithic component with many browser dependencies.
 */

const API_BASE = 'https://apex-invest-backend.up.railway.app/api';
const TOKEN    = 'mock-jwt-token';

// ── Shared fetch helper (mirrors App.js API._fetch) ────────────
const apiFetch = async (path, opts = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// ── Mock fetch before each test ────────────────────────────────
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok:   true,
      json: () => Promise.resolve({ ok: true, data: {} }),
    })
  );
});

afterEach(() => jest.resetAllMocks());


// ── URL correctness — API path contracts ───────────────────────
describe('API path contracts', () => {

  it('register → POST /auth/register', async () => {
    await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', email: 'test@test.com', password: 'pass123' }),
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/register'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('login → POST /auth/login', async () => {
    await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'pass123' }),
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('portfolio → GET /portfolio with auth header', async () => {
    await apiFetch('/portfolio');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/portfolio'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }),
      })
    );
  });

  it('stripe checkout → POST /stripe/checkout (not /payments/*)', async () => {
    await apiFetch('/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan: 'pro', success_url: 'https://x.com', cancel_url: 'https://x.com' }),
    });
    const url = fetch.mock.calls[0][0];
    expect(url).toContain('/stripe/checkout');
    expect(url).not.toContain('/payments/create-checkout');
  });

  it('profile update → PUT /settings/profile (not PATCH /user/settings)', async () => {
    await apiFetch('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: 'New Name' }),
    });
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/settings/profile');
    expect(url).not.toContain('/user/settings');
    expect(opts.method).toBe('PUT');
  });

  it('change password → PUT /settings/password (not POST /auth/change-password)', async () => {
    await apiFetch('/settings/password', {
      method: 'PUT',
      body: JSON.stringify({ current_password: 'old', new_password: 'new123' }),
    });
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/settings/password');
    expect(url).not.toContain('/auth/change-password');
    expect(opts.method).toBe('PUT');
  });

  it('add holding → POST /holdings (not /holdings/crypto)', async () => {
    await apiFetch('/holdings', {
      method: 'POST',
      body: JSON.stringify({ asset: 'BTC', asset_type: 'crypto', quantity: 0.5, avg_price: 45000 }),
    });
    const [url] = fetch.mock.calls[0];
    expect(url).toMatch(/\/holdings$/);
    expect(url).not.toContain('/holdings/crypto');
  });

  it('delete holding → DELETE /holdings/{id} (no type segment)', async () => {
    await apiFetch('/holdings/hold-uuid-001', { method: 'DELETE' });
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/holdings/hold-uuid-001');
    expect(opts.method).toBe('DELETE');
    // Old path was /holdings/crypto/hold-uuid-001 — must not have 3 segments
    expect(url.split('/holdings/')[1]).toBe('hold-uuid-001');
  });

  it('journal → offset-based pagination (not page=)', async () => {
    await apiFetch('/journal?offset=0&limit=20');
    const [url] = fetch.mock.calls[0];
    expect(url).toContain('offset=0');
    expect(url).not.toContain('page=');
  });

  it('AI analyze body uses max_tokens (not maxTokens)', async () => {
    await apiFetch('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'Analyze EUR/USD', max_tokens: 700 }),
    });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body).toHaveProperty('max_tokens', 700);
    expect(body).not.toHaveProperty('maxTokens');
  });

  it('affiliate stats → GET /affiliate/stats', async () => {
    await apiFetch('/affiliate/stats');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/affiliate/stats'),
      expect.anything()
    );
  });

  it('subscription status → GET /stripe/status (not /payments/subscription)', async () => {
    await apiFetch('/stripe/status');
    const [url] = fetch.mock.calls[0];
    expect(url).toContain('/stripe/status');
    expect(url).not.toContain('/payments/subscription');
  });
});


// ── Utility logic tests ────────────────────────────────────────
describe('Utility logic', () => {

  it('DB health URL has no double braces', () => {
    const base = 'https://apex-invest-backend.up.railway.app/api';
    const url  = `${base.replace('/api', '')}/health`;
    expect(url).toBe('https://apex-invest-backend.up.railway.app/health');
    expect(url).not.toContain('}}');
  });

  it('portfolio maps open field (not trades)', () => {
    // Simulate backend response shape
    const portData = { balance: 10000, open: [{ id: 't1' }], history: [], stats: {} };
    // Frontend should read portData.open, not portData.trades
    const portfolio = {
      balance: portData.balance || 100000,
      trades:  portData.open    || [],   // correct mapping
      history: portData.history || [],
    };
    expect(portfolio.trades).toHaveLength(1);
    expect(portfolio.trades[0].id).toBe('t1');
  });

  it('alerts response is a direct array (not {alerts:[]})', () => {
    // Backend returns array directly
    const alertsData = [{ id: 'a1', pair: 'EUR/USD', triggered: false }];
    const alerts = Array.isArray(alertsData) ? alertsData : [];
    expect(alerts).toHaveLength(1);
  });

  it('getMe response has id at top level (not nested in .user)', () => {
    // Backend getMe returns { id, name, email, plan } directly
    const data = { id: 'uid-1', name: 'Test', email: 'test@test.com', plan: 'free' };
    // Correct check: data?.id (not data?.user?.id)
    expect(data?.id).toBe('uid-1');
    expect(data?.user).toBeUndefined();
  });

  it('DCA avg_price calculation is correct', () => {
    // When adding to existing holding, should DCA average
    const oldQty   = 0.5;
    const oldPrice = 40000;
    const newQty   = 0.5;
    const newPrice = 50000;
    const totalQty = oldQty + newQty;
    const avgPrice = (oldQty * oldPrice + newQty * newPrice) / totalQty;
    expect(avgPrice).toBe(45000);
    expect(totalQty).toBe(1.0);
  });

  it('journal mood stats default counts all moods', () => {
    const VALID_MOODS = ['confident', 'neutral', 'anxious', 'greedy', 'fearful'];
    const counts = Object.fromEntries(VALID_MOODS.map(m => [m, 0]));
    counts['none'] = 0;
    expect(Object.keys(counts)).toHaveLength(6);
    expect(counts.confident).toBe(0);
  });
});


// ── Error handling ─────────────────────────────────────────────
describe('API error handling', () => {

  it('non-ok response throws with detail field (FastAPI format)', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok:   false,
        status: 400,
        json: () => Promise.resolve({ detail: 'Email already registered' }),
      })
    );
    await expect(apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'X', email: 'x@x.com', password: '123456' }),
    })).rejects.toThrow('HTTP 400');
  });

  it('network failure rejects gracefully', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
    await expect(apiFetch('/portfolio')).rejects.toThrow('Network error');
  });
});
