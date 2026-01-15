# PRD: Existing App Audit & Gap Analysis

**Target App:** CoachReflect (/home/kevin/CoachReflect)
**Reference:** `/home/kevin/FootballGPT` (gold standard)
**Creates:** Gap analysis and improvement tasks

---

## Feature Branch
`ralph/audit-[app-name]`

---

## PHASE 1: Gap Analysis (Research Only)

### US-001: Audit Supabase client setup
**Priority:** 1

**Check:** Does app have three separate Supabase clients?
- `src/lib/supabase/client.ts` (browser)
- `src/lib/supabase/server.ts` (server components/API routes)
- `src/lib/supabase/admin.ts` (webhooks/crons, service role)

**Compare to:** `/home/kevin/FootballGPT/src/lib/supabase/`

**Output:** Report which clients exist vs missing

**Acceptance Criteria:**
- [ ] All three locations checked
- [ ] Gap report written to progress.txt
- [ ] npm run build passes

---

### US-002: Audit API route patterns
**Priority:** 2

**Check each API route for:**
1. Authentication check (first thing)
2. Rate limiting
3. Server-side input validation
4. Permission/subscription checks
5. Try/catch with generic error responses

**Compare to:** `/home/kevin/FootballGPT/src/app/api/chat/route.ts`

**Output:** List of API routes not following pattern

**Acceptance Criteria:**
- [ ] All API routes reviewed
- [ ] Non-compliant routes listed
- [ ] npm run build passes

---

### US-003: Audit free tier implementation
**Priority:** 3

**Check:**
- Is free tier tracked SERVER-SIDE (database)?
- Or only client-side (localStorage) - EXPLOITABLE!

**Red flags:**
- `localStorage.getItem('messages_used')`
- `sessionStorage` for limits
- Client-side only checks

**Compare to:** `/home/kevin/FootballGPT/src/lib/usage.ts`

**Output:** Security assessment of free tier

**Acceptance Criteria:**
- [ ] Free tier mechanism identified
- [ ] Security assessment documented
- [ ] npm run build passes

---

### US-004: Audit Stripe webhook
**Priority:** 4

**Check webhook handler for:**
1. Signature verification FIRST (before any processing)
2. Idempotency (processed event IDs tracked)
3. Admin client for DB writes (not user client)
4. All required events handled

**Required events:**
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_failed

**Compare to:** `/home/kevin/FootballGPT/src/app/api/stripe/webhook/route.ts`

**Output:** Webhook compliance report

**Acceptance Criteria:**
- [ ] Webhook reviewed
- [ ] Missing patterns identified
- [ ] npm run build passes

---

### US-005: Audit RLS policies
**Priority:** 5

**Check Supabase dashboard for:**
- RLS enabled on ALL tables
- Policies exist for each table
- Default deny (no open policies)

**Common mistakes:**
- RLS disabled on sensitive tables
- Overly permissive SELECT policies
- Missing DELETE restrictions

**Output:** List of tables with RLS issues

**Acceptance Criteria:**
- [ ] All tables reviewed
- [ ] RLS gaps documented
- [ ] npm run build passes

---

### US-006: Audit missing features
**Priority:** 6

**Check for presence of:**

| Feature | Location to check | FootballGPT has it? |
|---------|-------------------|---------------------|
| Gamification (streaks) | `src/lib/gamification.ts` | YES |
| Email sequences | `src/lib/email-sequences.ts` | YES |
| Push notifications | `src/lib/push-notifications.ts` | YES |
| Admin dashboard | `src/app/admin/` | YES |
| Feedback modal | `src/components/feedback-reason-modal.tsx` | YES |
| PWA manifest | `public/manifest.json` | YES |
| Service worker | `public/sw.js` | YES |
| Bottom nav (mobile) | `src/components/bottom-nav.tsx` | YES |
| Analytics | `src/lib/analytics.ts` | YES |

**Output:** Feature gap matrix

**Acceptance Criteria:**
- [ ] All features checked
- [ ] Gap matrix created
- [ ] npm run build passes

---

### US-007: Generate improvement PRD
**Priority:** 7

**Based on gaps found, create:**
- `relentless/features/improvements/prd.md`
- Prioritized list of fixes
- Each fix as a user story

**Priority order:**
1. Security fixes (free tier, RLS, webhook)
2. Supabase client fixes
3. API route pattern fixes
4. Missing features

**Acceptance Criteria:**
- [ ] Improvement PRD created
- [ ] User stories prioritized
- [ ] npm run build passes

---

## PHASE 2: Fixes (After Audit Approved)

Run the generated improvement PRD through Ralph.

---

## Usage

```bash
# 1. Create feature for audit
ralph create CruiseGPT audit

# 2. Copy this template to the PRD
cp templates/prd-templates/existing-app-audit.md \
   /home/kevin/CruiseGPT/relentless/features/audit/prd.md

# 3. Edit to set target app path

# 4. Run Ralph for audit (research only)
ralph run CruiseGPT audit --max-iterations 10

# 5. Review gaps in progress.txt

# 6. Run improvements PRD
ralph run CruiseGPT improvements
```

---

## Output Files

After audit:
- `progress.txt` - Detailed findings
- `relentless/features/improvements/prd.md` - Generated fix tasks
- `relentless/features/improvements/prd.json` - Machine-readable tasks

---

## Security Audit Checklist (Quick)

Run this manually first to catch critical issues:

```bash
# Check for hardcoded secrets
grep -r "sk_live" --include="*.ts" --include="*.tsx" src/
grep -r "supabase_service" --include="*.ts" --include="*.tsx" src/
grep -r "ANTHROPIC_API_KEY" --include="*.ts" --include="*.tsx" src/

# Check for client-side free tier
grep -r "localStorage" --include="*.ts" --include="*.tsx" src/ | grep -i "usage\|limit\|free\|message"

# Check RLS status (requires Supabase CLI)
supabase db dump --schema public | grep "ENABLE ROW LEVEL SECURITY"
```
