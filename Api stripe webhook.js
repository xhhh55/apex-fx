// ════════════════════════════════════════════════════════════════
// 📁 api/stripe-webhook.js — معالجة أحداث Stripe
// يتلقى إشعارات من Stripe عند نجاح/فشل الدفع
// ════════════════════════════════════════════════════════════════
// في Vercel env vars أضف:
//   STRIPE_WEBHOOK_SECRET = whsec_... (من Stripe Dashboard → Webhooks)
// ════════════════════════════════════════════════════════════════

const Stripe = require('stripe');

export const config = { api: { bodyParser: false } };

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ── معالجة الأحداث ──────────────────────────────────────────
  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const plan   = session.metadata?.plan;
      // ← هنا: حدّث قاعدة البيانات (Supabase/Railway)
      // await supabase.from('users').update({ plan }).eq('id', userId)
      console.log(`✅ Payment success: user=${userId}, plan=${plan}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      // ← هنا: رجّع المستخدم للخطة المجانية
      console.log(`⚠️ Subscription cancelled: ${sub.customer}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      // ← هنا: أرسل إيميل للمستخدم
      console.log(`❌ Payment failed: ${invoice.customer_email}`);
      break;
    }
  }

  res.json({ received: true });
}