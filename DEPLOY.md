# 🚀 APEX INVEST — دليل الـ Deploy الكامل

> **الترتيب المهم:** Supabase → Railway → Stripe → Vercel

---

## 0️⃣ قبل البدء — ارفع الكود على GitHub

```bash
git init
git add .
git commit -m "initial: APEX INVEST full app"
git remote add origin https://github.com/YOUR_USERNAME/apex-invest.git
git push -u origin master
```

> تأكد أن `.env` **غير مرفوع** — مذكور في `.gitignore` ✓

---

## 1️⃣ Supabase (قاعدة البيانات)

1. اذهب لـ https://supabase.com → **New Project**
   - Name: `apex-invest-db`
   - Password: اختر كلمة سر قوية واحفظها
   - Region: اختر الأقرب لجمهورك

2. بعد الإنشاء (≈2 دقيقة) → **SQL Editor** → افتح ملف `schema.sql` والصق كل محتواه → **Run**
   - يُنشئ جداول: `users`, `trades`, `alerts`, `holdings`, `journal`, `affiliates`, `referrals`

3. اذهب **Settings → API** وانسخ:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (ليس anon) → `SUPABASE_SERVICE_KEY`

---

## 2️⃣ Railway (Backend — FastAPI)

### طريقة A: من GitHub (الأسهل)

1. اذهب لـ https://railway.app → **New Project → Deploy from GitHub repo**
2. اختر `apex-invest` repository
3. Railway سيكتشف `nixpacks.toml` ويبني Python تلقائياً

### طريقة B: Railway CLI

```bash
npm install -g @railway/cli
railway login
railway init          # من داخل مجلد apex-fx
railway up
```

### إضافة متغيرات البيئة

في Railway → **Variables** → أضف الآتي بالضبط:

```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=أكتب_سلسلة_عشوائية_64_حرف_على_الأقل
JWT_EXPIRY_DAYS=30
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ELITE=price_...
ANTHROPIC_API_KEY=sk-ant-...
ALLOWED_ORIGINS=https://apex-invest.vercel.app,http://localhost:3000
FRONTEND_URL=https://apex-invest.vercel.app
PORT=8000
```

### توليد JWT_SECRET آمن

```bash
# في الـ terminal:
python3 -c "import secrets; print(secrets.token_hex(32))"
# أو
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### تحقق من الـ Deploy

بعد اكتمال البناء، انسخ الـ Railway URL (مثال: `https://apex-invest-backend.up.railway.app`) ثم:

```bash
# Health check
curl https://YOUR-RAILWAY-URL/health
# → {"status":"ok","service":"APEX INVEST API","version":"1.0.0"}

# API Docs (Swagger UI)
open https://YOUR-RAILWAY-URL/docs
```

---

## 3️⃣ Stripe (المدفوعات)

### إنشاء المنتجات

1. اذهب لـ https://dashboard.stripe.com/products → **Add Product**

2. **المنتج الأول — APEX Pro:**
   - Name: `APEX Pro`
   - Price: `$29.00` / month (recurring)
   - انسخ الـ Price ID → `STRIPE_PRICE_PRO`

3. **المنتج الثاني — APEX Elite:**
   - Name: `APEX Elite`
   - Price: `$79.00` / month (recurring)
   - انسخ الـ Price ID → `STRIPE_PRICE_ELITE`

### إعداد الـ Webhook

1. **Developers → Webhooks → Add endpoint**
   - Endpoint URL: `https://YOUR-RAILWAY-URL/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`

2. بعد الإنشاء → انسخ **Signing secret** → `STRIPE_WEBHOOK_SECRET`

3. حدّث المتغير في Railway وأعد الـ Deploy

### اختبار الدفع (Test Mode)

```bash
# استخدم البطاقة التجريبية:
# Card: 4242 4242 4242 4242
# Expiry: أي تاريخ مستقبلي
# CVC: أي 3 أرقام
```

---

## 4️⃣ Vercel (Frontend — React)

### طريقة A: من GitHub (الأسهل)

1. اذهب لـ https://vercel.com → **New Project**
2. استورد الـ repository من GitHub
3. Vercel سيكتشف `vercel.json` تلقائياً

### إضافة متغيرات البيئة في Vercel

#### طريقة A: Vercel Secrets (الأكثر أماناً)

```bash
vercel secrets add apex_api_url "https://YOUR-RAILWAY-URL/api"
vercel secrets add apex_stripe_pub_key "pk_live_..."
```

#### طريقة B: Vercel Dashboard

في **Settings → Environment Variables** أضف:

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `https://YOUR-RAILWAY-URL/api` |
| `REACT_APP_STRIPE_KEY` | `pk_live_...` (من Stripe → API Keys → Publishable key) |

> `vercel.json` يربط هذه المتغيرات تلقائياً عبر `@apex_api_url` و `@apex_stripe_pub_key`

4. اضغط **Deploy**
5. بعد الانتهاء انسخ الـ Vercel URL (مثال: `https://apex-invest.vercel.app`)

### تحديث ALLOWED_ORIGINS في Railway

```
ALLOWED_ORIGINS=https://apex-invest.vercel.app,http://localhost:3000
FRONTEND_URL=https://apex-invest.vercel.app
```

---

## 5️⃣ اختبار شامل بعد الـ Deploy

```bash
BASE=https://YOUR-RAILWAY-URL

# 1. Health check
curl $BASE/health

# 2. تسجيل مستخدم جديد
curl -X POST $BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@apex.com","password":"pass123456"}'
# → {"token":"...","user":{...}}

# 3. تسجيل الدخول (احفظ الـ token)
TOKEN=$(curl -s -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@apex.com","password":"pass123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# 4. جلب البيانات
curl $BASE/api/auth/me -H "Authorization: Bearer $TOKEN"
curl $BASE/api/portfolio -H "Authorization: Bearer $TOKEN"
curl $BASE/api/alerts    -H "Authorization: Bearer $TOKEN"
curl $BASE/api/holdings  -H "Authorization: Bearer $TOKEN"
curl $BASE/api/journal   -H "Authorization: Bearer $TOKEN"
curl $BASE/api/settings  -H "Authorization: Bearer $TOKEN"

# 5. فتح الـ Swagger UI
open $BASE/docs
```

---

## 6️⃣ Domain مخصص (اختياري)

### Vercel
- Settings → Domains → أضف `apex-invest.app`
- أضف DNS record عند مزود الدومين:
  ```
  CNAME  www   cname.vercel-dns.com
  A      @     76.76.21.21
  ```

### Railway
- Settings → Networking → Custom Domain → أضف `api.apex-invest.app`
- حدّث `REACT_APP_API_URL` في Vercel: `https://api.apex-invest.app/api`

---

## ✅ Checklist كاملة

### Supabase
- [ ] مشروع جديد منشأ
- [ ] `schema.sql` منفّذ بالكامل (7 جداول)
- [ ] `SUPABASE_URL` و `SUPABASE_SERVICE_KEY` منسوخان

### Railway (Backend)
- [ ] Backend deployed ويرد على `/health`
- [ ] جميع متغيرات البيئة مضافة (11 متغير)
- [ ] Swagger UI يعمل على `/docs`

### Stripe
- [ ] منتجان منشأن (Pro + Elite)
- [ ] Webhook مضاف مع الـ 3 events
- [ ] `STRIPE_WEBHOOK_SECRET` محدّث في Railway

### Vercel (Frontend)
- [ ] Frontend deployed
- [ ] `REACT_APP_API_URL` يشير للـ Railway URL الصحيح
- [ ] التسجيل والدخول يعملان
- [ ] الأسعار الحية تظهر

### اختبارات وظيفية
- [ ] تسجيل مستخدم جديد ✓
- [ ] تسجيل دخول ✓
- [ ] فتح صفقة تداول ✓
- [ ] إضافة تنبيه سعري ✓
- [ ] Stripe checkout (بطاقة تجريبية) ✓
- [ ] إضافة holding ✓
- [ ] كتابة journal entry ✓

---

## 🆘 حل المشاكل الشائعة

| المشكلة | السبب المحتمل | الحل |
|---------|---------------|------|
| `CORS error` في الـ Browser | `ALLOWED_ORIGINS` لا يشمل الـ Vercel URL | حدّث المتغير في Railway وأعد Deploy |
| `401 Unauthorized` | `JWT_SECRET` مختلف بين البيئات | تأكد من نفس القيمة في Railway |
| `500 Internal Server Error` | `SUPABASE_URL` أو `SERVICE_KEY` خاطئ | تحقق من Variables في Railway |
| Stripe webhook `400` | `STRIPE_WEBHOOK_SECRET` خاطئ | انسخه من Stripe Dashboard مجدداً |
| Railway يبني Node بدل Python | `nixpacks.toml` غير موجود | تأكد من رفع الملف على GitHub |
| Vercel `404` عند reload | `vercel.json` مفقود أو rewrites خاطئة | تحقق من `vercel.json` في الـ root |
