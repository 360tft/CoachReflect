# CoachReflect E2E Tests

End-to-end tests using Playwright for critical user journeys.

## Setup

```bash
# Install dependencies (includes Playwright)
npm install

# Install Playwright browsers
npx playwright install
```

## Environment Variables

Create a `.env.local` file with test credentials:

```bash
E2E_TEST_EMAIL=test@example.com
E2E_TEST_PASSWORD=your-test-password

# Optional: Test against different URL
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

## Running Tests

```bash
# Run all tests (headless)
npm run test:e2e

# Run tests with UI (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug a specific test
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/reflection.spec.ts

# Run tests matching pattern
npx playwright test --grep "reflection"
```

## Test Structure

### Common Tests (All Products)

- `auth.spec.ts` - Login, signup flows
- `authenticated.spec.ts` - Protected routes (dashboard, billing, settings)

### CoachReflect-Specific Tests

- `reflection.spec.ts` - Creating new reflections, multi-turn conversations
- `history.spec.ts` - Viewing past reflections, history list

### Helper Functions

- `helpers.ts` - Shared utilities for tests
  - `goToDashboardReady()` - Navigate to dashboard and ensure ready
  - `waitForModalsToClose()` - Wait for blocking overlays to close

### Auth Setup

- `auth.setup.ts` - Logs in once and saves session to `e2e/.auth/user.json`
- Authenticated tests reuse this session (faster, no repeated logins)

## Test Organization

```
e2e/
├── .auth/               # Saved auth sessions (gitignored)
├── auth.setup.ts        # One-time login
├── helpers.ts           # Shared utilities
├── auth.spec.ts         # Auth flow tests
├── authenticated.spec.ts # Protected routes
├── reflection.spec.ts   # Reflection creation tests
└── history.spec.ts      # History viewing tests
```

## Writing New Tests

1. Add new test file in `e2e/` directory
2. Import helpers if needed
3. Use `test.describe()` blocks to group tests
4. For authenticated tests, use:
   ```typescript
   test.use({ storageState: 'e2e/.auth/user.json' })
   ```

## CI/CD Integration

Tests run automatically in GitHub Actions on push/PR.

Environment variables for CI:
- `PLAYWRIGHT_TEST_BASE_URL` - Vercel preview URL
- `E2E_TEST_EMAIL` - Test user email (GitHub secret)
- `E2E_TEST_PASSWORD` - Test user password (GitHub secret)

## Debugging

```bash
# Run with debug mode (step through tests)
npm run test:e2e:debug

# Generate trace for failed tests
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## Coverage

Current test coverage:

- ✅ Authentication (login, signup)
- ✅ Dashboard access
- ✅ Creating new reflections
- ✅ Multi-turn conversations
- ✅ Viewing reflection history
- ✅ Billing page access
- ✅ Settings page access

## Known Issues

- Tests may be slow if AI responses take time
- History tests assume some reflections exist (may fail for brand new accounts)
- UI elements may vary based on user state (Free vs Pro)

## Best Practices

- Keep tests focused on user behavior, not implementation details
- Use data attributes (`data-testid`) for stable selectors where possible
- Avoid hard waits - use `waitForSelector()` or `waitForURL()` instead
- Test both happy path and edge cases
- Keep test data isolated (don't rely on production data)
