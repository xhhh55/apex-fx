// ════════════════════════════════════════════════════════════════
// 📁 api/create-checkout.js — Vercel Serverless Function
// انشئ هذا الملف في مشروع Vercel لتفعيل Stripe الحقيقي
// ════════════════════════════════════════════════════════════════
// الخطوات:
// 1. اذهب لـ stripe.com وأنشئ حساب
// 2. من Dashboard → Products → أنشئ Pro ($9.99/mo) وElite ($24.99/mo)
// 3. انسخ كل Price ID وضعه في apex-invest.jsx داخل STRIPE_PRICES
// 4. من Dashboard → Developers → API Keys → انسخ Secret Key
// 5. في Vercel Dashboard → Settings → Environment Variables:
//    STRIPE_SECRET_KEY = sk_live_...
// 6. انشئ هذا الملف في /api/create-checkout.js في مشروعك
// ════════════════════════════════════════════════════════════════

const Stripe = require('stripe');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const {
    price_id,        // من STRIPE_PRICES في التطبيق
    success_url,     // رابط النجاح
    cancel_url,      // رابط الإلغاء
    customer_email,  // إيميل المستخدم
    user_id,         // ID المستخدم
    plan,            // 'pro' | 'elite'
  } = req.body;

  if (!price_id) {
    return res.status(400).json({ error: 'price_id is required' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: success_url || `${req.headers.origin}?payment=success&plan=${plan}`,
      cancel_url:  cancel_url  || `${req.headers.origin}?payment=cancelled`,
      customer_email: customer_email || undefined,
      metadata: {
        source: 'apex-invest',
        user_id: user_id || 'guest',
        plan: plan || 'pro',
      },
      // تخصيص صفحة Stripe
      custom_text: {
        submit: { message: 'APEX INVEST — اشتراك آمن مع إمكانية الإلغاء في أي وقت' }
      },
    });

    return res.json({
      ok: true,
      url: session.url,
      sessionId: session.id,
    });

  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}