// ════════════════════════════════════════════════════════════════
// 📁 api/send-email.js — Vercel Serverless Function (Resend API)
// ════════════════════════════════════════════════════════════════
// Vercel env vars needed:
//   RESEND_API_KEY = re_... (from resend.com → API Keys)
// ════════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to, subject, html } = req.body;
  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing: to, subject, html' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not set in env vars' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'APEX INVEST <no-reply@apex-invest.app>',
        to: [to],
        subject,
        html,
        // Optional: track opens/clicks
        tags: [{ name: 'source', value: 'apex-invest' }],
      }),
    });

    const data = await response.json();
    if (response.ok) {
      return res.json({ ok: true, id: data.id });
    } else {
      return res.status(response.status).json({ ok: false, error: data.message });
    }
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}