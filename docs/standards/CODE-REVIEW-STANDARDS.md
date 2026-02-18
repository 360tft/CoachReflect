# Code Review Standards (All Products)

**Master Reference Document**
All code changes must pass these checks before commit. No exceptions.

---

## Quick Checklist (Copy for Each PR)

```markdown
## Code Review Checklist

### Security
- [ ] No hardcoded secrets, API keys, or credentials
- [ ] No console.log with sensitive data
- [ ] User input validated server-side (never trust client)
- [ ] SQL/NoSQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding, CSP headers)
- [ ] Authentication checked on all protected routes
- [ ] Authorization verified (user can only access own data)
- [ ] Rate limiting on public endpoints
- [ ] CORS configured correctly

### Code Bloat Prevention
- [ ] No duplicate code (DRY principle)
- [ ] No unused imports
- [ ] No unused variables or functions
- [ ] No commented-out code (delete it)
- [ ] No console.log statements (except intentional logging)
- [ ] Dependencies justified (no bloated libraries for simple tasks)
- [ ] No redundant null checks or type guards
- [ ] Shared utilities used where applicable

### Performance
- [ ] No N+1 database queries
- [ ] Large lists paginated or virtualized
- [ ] Images optimized (WebP, lazy loading)
- [ ] No blocking operations on main thread
- [ ] Memoization used where appropriate
- [ ] Bundle size impact considered

### Accessibility (WCAG AA)
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color contrast ratio >= 4.5:1
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Screen reader tested (basic)

### Responsiveness
- [ ] Mobile-first tested (320px minimum)
- [ ] Tablet breakpoint tested (768px)
- [ ] Desktop tested (1024px+)
- [ ] Touch targets >= 44px
- [ ] No horizontal scroll on mobile

### Design Standards
- [ ] No emojis in UI elements
- [ ] Typography follows hierarchy
- [ ] Spacing uses scale (4px/8px)
- [ ] Colors from approved palette

### Build & Deploy
- [ ] `npm run build` passes
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Tests pass (if applicable)
```

---

## Security Audit (Detailed)

### 1. Secrets & Credentials

**NEVER commit:**
- API keys
- Database connection strings
- JWT secrets
- OAuth client secrets
- Webhook signing secrets
- Private keys

**Detection:**
```bash
# Search for potential secrets
grep -rn "sk_live\|sk_test\|api_key\|apikey\|secret\|password\|token" --include="*.ts" --include="*.tsx" --include="*.js" src/

# Check for .env files accidentally committed
git ls-files | grep -E "\.env$|\.env\.local$"
```

**Prevention:**
- Use environment variables
- Add secrets to `.gitignore`
- Use secret scanning in CI (GitHub Advanced Security)
- Rotate any exposed keys immediately

### 2. Input Validation

**Server-side validation is MANDATORY:**

```typescript
// BAD - trusts client
export async function POST(req: Request) {
  const { userId, amount } = await req.json()
  // Directly uses userId from client - INSECURE
  await db.update(userId, amount)
}

// GOOD - validates and authorizes
export async function POST(req: Request) {
  const { user } = await getSession()
  if (!user) return unauthorized()

  const body = await req.json()
  const amount = parseFloat(body.amount)
  if (isNaN(amount) || amount <= 0) {
    return badRequest('Invalid amount')
  }

  // Uses authenticated user ID, not client-provided
  await db.update(user.id, amount)
}
```

### 3. SQL/NoSQL Injection

**Always use parameterized queries:**

```typescript
// BAD - SQL injection vulnerable
const result = await db.query(`SELECT * FROM users WHERE id = '${userId}'`)

// GOOD - parameterized
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId])

// Supabase - use the client properly
const { data } = await supabase.from('users').select('*').eq('id', userId)
```

### 4. XSS Prevention

**Never render untrusted HTML:**

```tsx
// BAD - XSS vulnerable
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// GOOD - React escapes by default
<div>{userInput}</div>

// If HTML needed, sanitize first
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### 5. Authentication & Authorization

**Every protected route must:**
1. Verify the session exists
2. Verify the user owns the resource

```typescript
// Pattern for all protected API routes
export async function GET(req: Request) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Authorize - user can only access own data
  const { data } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', user.id) // RLS should enforce this too, but be explicit

  return NextResponse.json(data)
}
```

### 6. Rate Limiting

**Required on:**
- Authentication endpoints (login, signup, password reset)
- AI/LLM endpoints (expensive)
- Any public API

```typescript
import { rateLimit } from '@/lib/rate-limit'

const LIMITS = {
  AUTH: { maxRequests: 5, windowSeconds: 60 },
  CHAT: { maxRequests: 30, windowSeconds: 60 },
}
```

### 7. Secure Logging (No Sensitive Data)

**NEVER log these:**
```typescript
// BAD - exposes sensitive data
console.log('User:', user) // May contain email, tokens
console.log('Password:', password)
console.log('Token:', token)
console.log('API Key:', apiKey)
console.log('Request body:', req.body) // May contain passwords

// GOOD - sanitized logging
console.log('User authenticated:', user.id) // ID only
console.log('Auth failed for user:', email.substring(0, 3) + '***')
console.log('Processing request for:', userId)
```

**Detection:**
```bash
# Find potentially dangerous logs
grep -rn "console.log.*password\|console.log.*token\|console.log.*key\|console.log.*email\|console.log.*user)" --include="*.ts" --include="*.tsx" src/
```

### 8. Error Handling (Don't Reveal Internals)

**NEVER expose internal errors to users:**

```typescript
// BAD - reveals database/system details
catch (err) {
  return NextResponse.json({ error: err.message })
  // "ECONNREFUSED 127.0.0.1:5432" or "relation users does not exist"
}

// GOOD - generic to user, detailed in logs
catch (err) {
  console.error('Database error:', err) // Detailed for debugging
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
}
```

**Error message rules:**
| Scenario | User Message | Log |
|----------|--------------|-----|
| DB connection failed | "Something went wrong" | Full error |
| Invalid query | "Something went wrong" | Query + error |
| Auth failed | "Invalid credentials" | User ID + reason |
| Validation failed | Specific field errors | Full validation result |
| Rate limited | "Too many requests" | User ID + endpoint |

---

## Security Tools (Run Monthly)

```bash
# Dependency vulnerabilities
npm audit

# Detect hardcoded secrets
npx secretlint "src/**/*.{ts,tsx}"

# Static security analysis
npx eslint --plugin security src/

# Find sensitive data in logs
grep -rn "console.log" src/ | grep -iE "password|token|key|email|secret|user\)"
```

**Add to CI pipeline:**
```yaml
- name: Security Audit
  run: |
    npm audit --audit-level=high
    npx secretlint "src/**/*.{ts,tsx}"
```

---

## Code Bloat Prevention (Detailed)

### 1. Detect Unused Code

**Tools:**
```bash
# TypeScript - find unused exports
npx ts-prune

# Find unused dependencies
npx depcheck

# Find unused files
npx unimported
```

**ESLint rules (add to .eslintrc):**
```json
{
  "rules": {
    "no-unused-vars": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "import/no-unused-modules": "error"
  }
}
```

### 2. Dependency Hygiene

**Before adding a package, ask:**
1. Can I do this in < 50 lines without a dependency?
2. Is this package maintained? (check npm, last publish date)
3. What's the bundle size impact? (bundlephobia.com)
4. Do I need the whole package or just one function?

**Bundle size tools:**
```bash
# Check bundle size
npx @next/bundle-analyzer

# Check package size before installing
npx bundlephobia-cli <package-name>
```

**Lightweight alternatives:**
| Heavy | Light Alternative |
|-------|-------------------|
| moment.js (329KB) | date-fns (tree-shakeable) or native Intl |
| lodash (531KB) | lodash-es (tree-shakeable) or native |
| axios (29KB) | native fetch |
| uuid (12KB) | crypto.randomUUID() |

### 3. Delete Aggressively

**Remove immediately:**
- Commented-out code (it's in git history)
- TODO comments older than 30 days
- Unused feature flags
- Deprecated functions
- Test files for deleted features
- Unused CSS classes

**Code archaeology rule:** If code hasn't been touched in 6 months and has no tests, consider deleting it.

### 4. Shared Utilities

**Create shared code for:**
- API error handling
- Date formatting
- Currency formatting
- Validation schemas
- Type definitions

**Location:** `src/lib/` or `src/utils/`

```typescript
// lib/format.ts - use everywhere
export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatDate(date: Date | string, style: 'short' | 'long' = 'short') {
  return new Intl.DateTimeFormat('en-US', { dateStyle: style }).format(new Date(date))
}
```

### 5. Component Patterns

**Avoid:**
```tsx
// BAD - repeated inline styles
<div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-lg">
<div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-lg">
<div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-lg">
```

**Better:**
```tsx
// GOOD - reusable component
function Card({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-lg ${className}`}>
      {children}
    </div>
  )
}
```

---

## Performance Audit

### 1. Database Queries

**N+1 Problem:**
```typescript
// BAD - N+1 queries
const users = await db.query('SELECT * FROM users')
for (const user of users) {
  const posts = await db.query('SELECT * FROM posts WHERE user_id = ?', [user.id])
  // This runs N additional queries
}

// GOOD - single query with join
const usersWithPosts = await db.query(`
  SELECT users.*, posts.*
  FROM users
  LEFT JOIN posts ON posts.user_id = users.id
`)
```

### 2. React Performance

```tsx
// Memoize expensive calculations
const expensiveResult = useMemo(() => calculateExpensiveThing(data), [data])

// Memoize callbacks passed to children
const handleClick = useCallback(() => doThing(id), [id])

// Use React.memo for pure components that render often
const ListItem = React.memo(function ListItem({ item }) {
  return <div>{item.name}</div>
})
```

### 3. Images

**Always:**
- Use WebP format (30% smaller than JPEG)
- Specify width and height (prevents CLS)
- Use Next.js Image component (automatic optimization)
- Lazy load below-fold images

```tsx
import Image from 'next/image'

<Image
  src="/hero.webp"
  alt="Description"
  width={1200}
  height={600}
  priority // Only for above-fold images
/>
```

---

## Accessibility Audit (WCAG AA)

### 1. Images
```tsx
// Every image needs alt text
<img src="chart.png" alt="Sales chart showing 20% growth in Q4" />

// Decorative images use empty alt
<img src="divider.png" alt="" role="presentation" />
```

### 2. Forms
```tsx
// Every input needs a label
<label htmlFor="email">Email address</label>
<input id="email" type="email" />

// Or use aria-label for icon-only buttons
<button aria-label="Close dialog">
  <XIcon />
</button>
```

### 3. Color Contrast

**Minimum ratios:**
- Normal text: 4.5:1
- Large text (18px+ bold or 24px+): 3:1
- UI components: 3:1

**Test:** Chrome DevTools > Lighthouse > Accessibility

### 4. Keyboard Navigation

```tsx
// All interactive elements must be focusable
<button>Clickable</button> // Good - naturally focusable
<div onClick={...}>Clickable</div> // Bad - not focusable

// If using div, add keyboard support
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Clickable
</div>
```

### 5. Focus States

```css
/* Never do this */
*:focus { outline: none; }

/* Always have visible focus */
:focus-visible {
  outline: 2px solid #E5A11C;
  outline-offset: 2px;
}
```

---

## Responsiveness Audit

### 1. Breakpoint Testing

Test at these widths:
| Breakpoint | Width | Device |
|------------|-------|--------|
| xs | 320px | Small phones |
| sm | 375px | iPhone SE |
| md | 768px | Tablets |
| lg | 1024px | Laptops |
| xl | 1280px | Desktops |

### 2. Mobile-First Patterns

```css
/* Start mobile, add complexity for larger screens */
.container {
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}
```

### 3. Touch Targets

**Minimum 44x44px for touch:**
```tsx
<button className="min-h-[44px] min-w-[44px] px-4 py-2">
  Click me
</button>
```

### 4. Common Mobile Issues

| Issue | Fix |
|-------|-----|
| Horizontal scroll | Check for fixed-width elements, use `max-w-full` |
| Tiny text | Minimum 16px for body text |
| Elements touching edges | Add padding to containers |
| Overlapping elements | Test flex/grid behavior at small sizes |

---

## Pre-Commit Automation

### 1. Husky + lint-staged

```bash
npm install -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": "prettier --write"
  }
}
```

### 2. Pre-commit hook

```bash
# .husky/pre-commit
npm run lint
npm run build
```

### 3. CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test
```

---

## Code Review Process

### For the Reviewer

1. **Security first** - Scan for secrets, injection, auth issues
2. **Architecture** - Does this fit the patterns in this codebase?
3. **Simplicity** - Is this the simplest solution that works?
4. **Bloat check** - Does this add unnecessary code or dependencies?
5. **Tests** - Are critical paths tested?

### For the Author

Before requesting review:
1. Run the full checklist above
2. Self-review the diff
3. Check `npm run build` passes
4. Check bundle size didn't increase dramatically
5. Test on mobile

---

## Monthly Maintenance Tasks

| Task | Tool/Command | Frequency |
|------|--------------|-----------|
| Update dependencies | `npm update` | Monthly |
| Security audit | `npm audit` | Monthly |
| Find unused code | `npx ts-prune` | Monthly |
| Bundle analysis | `npx @next/bundle-analyzer` | Monthly |
| Lighthouse audit | Chrome DevTools | Monthly |
| Accessibility scan | axe DevTools | Monthly |

---

## Anti-Patterns Reference

| Anti-Pattern | Why It's Bad | Fix |
|--------------|--------------|-----|
| `any` type | Defeats TypeScript | Use proper types |
| `// @ts-ignore` | Hides real errors | Fix the type error |
| `console.log` in prod | Information leak, noise | Remove or use proper logging |
| Commented code | Clutters, never gets deleted | Delete it (git has history) |
| Magic numbers | Unreadable | Use named constants |
| God components | Unmaintainable | Split into smaller components |
| Props drilling > 3 levels | Hard to trace | Use context or state management |
| Inline styles | Inconsistent, hard to maintain | Use Tailwind classes |
| Catch without handling | Swallows errors silently | Log or rethrow |

---

## Tools Reference

| Purpose | Tool | Command |
|---------|------|---------|
| Lint | ESLint | `npm run lint` |
| Format | Prettier | `npx prettier --write .` |
| Type check | TypeScript | `npx tsc --noEmit` |
| Unused exports | ts-prune | `npx ts-prune` |
| Unused deps | depcheck | `npx depcheck` |
| Security | npm audit | `npm audit` |
| Bundle size | Bundle Analyzer | Build with `ANALYZE=true` |
| Accessibility | axe | Browser extension |
| Performance | Lighthouse | Chrome DevTools |

---

*Last Updated: January 2026*
*Applies to: All products (CruiseGPT, RefereeGPT, CoachReflection, FitGPT, FootballGPT, and all future products)*
