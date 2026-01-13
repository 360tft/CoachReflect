# Ralph Guardrails

Append-only file. Same mistake NEVER happens twice.

When something breaks, add a sign here. Next iteration reads this first.

---

## Format

### Sign: [Short description]
- **Trigger:** When does this apply?
- **Instruction:** What to do instead
- **Added after:** [Iteration/context when learned]

---

## Universal Guardrails (All 360TFT Products)

### Sign: Three Supabase clients always
- **Trigger:** Any Supabase database operation
- **Instruction:** Use correct client: `client.ts` (browser), `server.ts` (API routes), `admin.ts` (webhooks/crons)
- **Added after:** FootballGPT production bugs from single-client pattern

### Sign: Server-side validation only
- **Trigger:** Any user input handling
- **Instruction:** NEVER trust client-side validation. Validate on server. Client validation is UX only.
- **Added after:** Security review - client-side bypass vulnerability

### Sign: Free tier in database
- **Trigger:** Implementing usage limits
- **Instruction:** Track in `usage_tracking` table, NOT localStorage. localStorage can be cleared.
- **Added after:** Users bypassing free tier by clearing browser data

### Sign: Check build before marking done
- **Trigger:** Completing any user story
- **Instruction:** Run `npm run build` and verify it passes. NEVER mark done if build fails.
- **Added after:** Broken builds deployed to production

### Sign: RLS on every table
- **Trigger:** Creating new database table
- **Instruction:** Enable RLS. Create policies. Default deny. Explicit allow.
- **Added after:** Data leak from missing RLS policy

### Sign: Rate limit auth endpoints
- **Trigger:** Creating login/signup/password-reset APIs
- **Instruction:** Aggressive limits: signup 3/15min, login 5/min, password-reset 3/hour
- **Added after:** Brute force attack attempt

### Sign: Webhook signature verification first
- **Trigger:** Stripe webhook handler
- **Instruction:** ALWAYS verify signature BEFORE processing. Never trust unverified webhooks.
- **Added after:** Webhook spoofing vulnerability

### Sign: Idempotent webhook processing
- **Trigger:** Processing Stripe events
- **Instruction:** Track processed event IDs. Check before processing. Webhooks can fire multiple times.
- **Added after:** Duplicate subscription records

### Sign: Customer ID before checkout
- **Trigger:** Creating Stripe checkout session
- **Instruction:** Create/get customer FIRST, store ID immediately, THEN create session with customer (not customer_email)
- **Added after:** Orphaned subscriptions without customer records

### Sign: No emojis in UI
- **Trigger:** Any UI component
- **Instruction:** NO emojis in navigation, buttons, headers, feature lists. Only allowed sparingly in AI chat responses.
- **Added after:** Design review - unprofessional appearance

### Sign: Check existing patterns first
- **Trigger:** Building any feature
- **Instruction:** Check FootballGPT for existing implementation. Copy pattern, adapt brand only.
- **Added after:** Inconsistent implementations across products

### Sign: Single source of truth for config
- **Trigger:** Hardcoding values (prices, limits, URLs)
- **Instruction:** Put in `lib/config.ts`. Import everywhere. Never hardcode in multiple places.
- **Added after:** Price mismatch between pricing page and checkout

### Sign: Never expose API keys in client code
- **Trigger:** Any API key usage
- **Instruction:** Only `NEXT_PUBLIC_*` vars in client code. All secret keys (`STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, etc.) server-side only. Run `grep -r "sk_live\|service_role\|ANTHROPIC\|RESEND" src/` to verify.
- **Added after:** Security audit found exposed keys in client bundle

### Sign: No unused code
- **Trigger:** Completing any feature
- **Instruction:** Delete unused imports, variables, functions. No commented-out code (git has history). Run `npx ts-prune` to check for unused exports.
- **Added after:** Code review - bloated bundle sizes

### Sign: No duplicate code
- **Trigger:** Writing similar logic in multiple places
- **Instruction:** If you write the same pattern 3+ times, extract to a utility in `lib/`. Check for existing utilities first.
- **Added after:** Code review - 5 copies of the same validation logic

### Sign: Responsive design required
- **Trigger:** Any UI component or page
- **Instruction:** Test at 320px (mobile), 768px (tablet), 1024px+ (desktop). Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`. Mobile-first approach.
- **Added after:** Users complained about broken mobile experience

### Sign: Touch targets 44px minimum
- **Trigger:** Any clickable element on mobile
- **Instruction:** Buttons, links, and interactive elements must be at least 44x44px on mobile. Use `min-h-[44px] min-w-[44px]` or `p-3` padding.
- **Added after:** Accessibility audit - buttons too small on mobile

### Sign: No console.log in production
- **Trigger:** Completing any feature
- **Instruction:** Remove all `console.log` statements. Use proper error tracking if needed. Check with `grep -r "console.log" src/`.
- **Added after:** Production logs filled with debug statements

### Sign: Never log sensitive data
- **Trigger:** Adding console.log or console.error for debugging
- **Instruction:** NEVER log: passwords, tokens, API keys, emails, full user objects, request bodies. Only log: user IDs, sanitized identifiers, operation names. Run `grep -rn "console.log.*password\|token\|key\|email\|user)" src/` to check.
- **Added after:** Security review - sensitive data exposed in logs

### Sign: Generic error messages to users
- **Trigger:** Returning error responses in API routes
- **Instruction:** NEVER return `err.message` to users - reveals internals. Use generic messages ("Something went wrong"). Log full error server-side.
- **Added after:** Database connection strings exposed in error responses

### Sign: Run npm audit monthly
- **Trigger:** Monthly maintenance
- **Instruction:** Run `npm audit` and fix high/critical vulnerabilities. Old dependencies have known exploits. Add to CI: `npm audit --audit-level=high`.
- **Added after:** React shell vulnerability reminder

### Sign: Check bundle size
- **Trigger:** Adding new dependencies
- **Instruction:** Before adding a package, check size at bundlephobia.com. Prefer lightweight alternatives. Use dynamic imports for large packages.
- **Added after:** 500KB dependency added for one small feature

### Sign: Alt text on all images
- **Trigger:** Any `<img>` or `<Image>` component
- **Instruction:** All images MUST have descriptive `alt` text. Empty alt="" only for decorative images.
- **Added after:** Accessibility audit - screen readers couldn't describe images

### Sign: Form labels required
- **Trigger:** Any form input
- **Instruction:** Every `<input>`, `<select>`, `<textarea>` needs an associated `<label>` with `htmlFor`. No placeholder-only inputs.
- **Added after:** Accessibility audit - forms unusable with screen readers

---

## Project-Specific Guardrails

Add product-specific lessons below as they're discovered.

### [Product Name]

<!-- Add signs as you learn them -->

---

## How to Add a Sign

When Ralph makes a mistake:

1. Stop and analyze what went wrong
2. Add a new sign using the format above
3. Be specific about the trigger condition
4. Give clear instruction on what to do instead
5. Note when/why this was learned

Signs are cheap. Repeated mistakes are expensive.
