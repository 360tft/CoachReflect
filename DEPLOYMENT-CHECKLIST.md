# Coach Reflection Deployment Checklist

**Status:** Code Complete - Ready for Production Deploy
**Estimated Time:** 40 minutes
**Last Verified:** 2026-01-15 (build passes, 58 routes)

---

## Pre-Deployment Verification

- [x] `npm run build` passes without errors
- [x] All 8 database migrations ready (`supabase/migrations/`)
- [x] Three Supabase clients implemented (client, server, admin)
- [x] Stripe integration complete (checkout, webhook, portal)
- [x] Auth middleware protecting `/dashboard/*` routes
- [x] Exit-ready docs exist (TECHNICAL.md, SOP.md)
- [x] Mobile apps configured (iOS + Android via Capacitor)

---

## Step 1: Supabase Setup (10 min)

### Create Project (if not exists)
1. Go to https://supabase.com/dashboard
2. Create new project: `coachreflect-prod`
3. Select region: `eu-west-2` (London) or closest to users
4. Generate strong database password, save to password manager

### Run Migrations (in order)
```bash
# Option A: Via Supabase Dashboard SQL Editor
# Copy and run each file in order:
supabase/migrations/20250105_initial_schema.sql
supabase/migrations/20250107_add_reflection_period.sql
supabase/migrations/20250107_session_plans.sql
supabase/migrations/20250111_add_footbalgpt_features.sql
supabase/migrations/20250111_add_pro_trial.sql
supabase/migrations/20250111_add_shared_reflections.sql
supabase/migrations/20260113_add_blog.sql
supabase/migrations/20260113_referrals.sql

# Option B: Via Supabase CLI
supabase db push
```

### Get Credentials
From Supabase Dashboard → Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL` → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` → service_role key (secret!)

### Configure Auth
1. Go to Authentication → URL Configuration
2. Set Site URL: `https://coachreflection.com` (or your domain)
3. Add Redirect URLs:
   - `https://coachreflection.com/api/auth/callback`
   - `http://localhost:3000/api/auth/callback` (for local dev)

---

## Step 2: Stripe Setup (10 min)

### Create Products
1. Go to https://dashboard.stripe.com/products
2. Create product: **Coach Reflection Pro**
   - Monthly: $7.99/month → save Price ID
   - Annual: $99/year → save Price ID
3. Create product: **Coach Reflection Sponsor** (optional)
   - Monthly: $99/month → save Price ID

### Get Credentials
From Stripe Dashboard → Developers → API keys:
- `STRIPE_SECRET_KEY` → Secret key (sk_live_...)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Publishable key (pk_live_...)

### Configure Webhook (after Vercel deploy)
1. Go to Developers → Webhooks
2. Add endpoint: `https://coachreflection.com/api/stripe/webhook`
3. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy Signing Secret → `STRIPE_WEBHOOK_SECRET`

---

## Step 3: Vercel Setup (10 min)

### Import Project
1. Go to https://vercel.com/new
2. Import from GitHub: `Coach Reflection`
3. Framework: Next.js (auto-detected)

### Environment Variables
Add these in Vercel → Settings → Environment Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID=price_...

# Google AI (Gemini) - Main AI provider
GOOGLE_AI_API_KEY=your-google-ai-api-key

# OpenAI (Whisper) - Voice transcription only
OPENAI_API_KEY=sk-...

# App Config
NEXT_PUBLIC_APP_URL=https://coachreflection.com
CRON_SECRET=generate-random-string-here
ADMIN_EMAILS=admin@360tft.com

# Optional: Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Optional: Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# Optional: Sentry
SENTRY_DSN=...
SENTRY_ORG=...
SENTRY_PROJECT=...
```

### Deploy
1. Click Deploy
2. Wait for build (~2 min)
3. Verify deployment at preview URL

### Configure Domain
1. Go to Settings → Domains
2. Add domain: `coachreflection.com`
3. Follow DNS instructions

---

## Step 4: Post-Deploy Verification (10 min)

### Test Critical Flows
- [ ] Landing page loads correctly
- [ ] Demo chat works (3 free messages)
- [ ] Sign up flow works (email + OAuth)
- [ ] Login/logout works
- [ ] Dashboard loads for authenticated users
- [ ] Create reflection works
- [ ] AI analysis works (Pro feature)
- [ ] Stripe checkout redirects correctly
- [ ] Webhook receives events (check Stripe dashboard)

### Configure Stripe Webhook (now that URL exists)
1. Go back to Stripe → Webhooks
2. Add production endpoint URL
3. Save signing secret to Vercel env vars
4. Redeploy if needed

### Test Payment Flow
1. Use Stripe test card: `4242 4242 4242 4242`
2. Verify subscription created in Stripe
3. Verify profile updated to `pro` tier
4. Verify Pro features unlocked

---

## Step 5: Mobile Apps (Optional - Later)

### iOS
```bash
cd /home/kevin/Coach Reflection
npm run build
npx cap sync ios
npx cap open ios
# Build and submit via Xcode
```

### Android
```bash
npx cap sync android
npx cap open android
# Build and submit via Android Studio
```

---

## Rollback Procedure

If something breaks:

1. **Vercel:** Go to Deployments → click previous working deployment → Promote to Production
2. **Database:** Supabase has point-in-time recovery (check Dashboard → Database → Backups)
3. **Stripe:** Webhooks can be disabled temporarily in Stripe Dashboard

---

## Monitoring

### Daily Checks
- [ ] Vercel function logs for errors
- [ ] Supabase logs for failed queries
- [ ] Stripe Dashboard for failed payments

### Weekly Checks
- [ ] User signups
- [ ] Conversion rate (free → pro)
- [ ] AI usage (Gemini API costs)
- [ ] Error trends

---

## Credentials Storage

After deployment, create `/home/kevin/Coach Reflection/docs/CREDENTIALS.md` (gitignored):

```markdown
# Coach Reflection Credentials

## Supabase
- Project URL: https://xxx.supabase.co
- Dashboard: https://supabase.com/dashboard/project/xxx
- Password: [stored in password manager]

## Stripe
- Dashboard: https://dashboard.stripe.com
- Mode: Live
- Webhook endpoint: https://coachreflection.com/api/stripe/webhook

## Vercel
- Project: https://vercel.com/xxx/coachreflect
- Domain: coachreflection.com

## Google AI
- Dashboard: https://aistudio.google.com/
- API Key: in Vercel env (GOOGLE_AI_API_KEY)
```

---

## Launch Announcement

After everything is verified:

1. [ ] Post to FCA community
2. [ ] Tweet from @coach_kevin_m
3. [ ] Email FCA members
4. [ ] Add to 360TFT footer cross-promo
5. [ ] Update indiepa.ge/kevinmiddleton

---

**Checklist complete. Ready to deploy when time permits.**
