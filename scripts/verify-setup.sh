#!/bin/bash
# Verify Product Setup
# Usage: ./scripts/verify-setup.sh
#
# Checks all services are configured correctly

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load setup file
if [ ! -f "$PROJECT_DIR/.env.setup" ]; then
  echo "Error: .env.setup not found"
  exit 1
fi

source "$PROJECT_DIR/.env.setup"

echo "=== Verifying Setup for $PRODUCT_NAME ==="
echo ""

ERRORS=0

# Function to check
check() {
  local name=$1
  local status=$2
  local message=$3

  if [ "$status" = "ok" ]; then
    echo "✓ $name"
  else
    echo "✗ $name - $message"
    ERRORS=$((ERRORS + 1))
  fi
}

echo "--- Domain & DNS ---"

# Check domain resolves
DOMAIN_IP=$(dig +short "$PRODUCT_DOMAIN" A 2>/dev/null | head -1)
if [ "$DOMAIN_IP" = "76.76.21.21" ]; then
  check "Domain A record" "ok"
else
  check "Domain A record" "fail" "Expected 76.76.21.21, got $DOMAIN_IP"
fi

# Check www CNAME
WWW_CNAME=$(dig +short "www.$PRODUCT_DOMAIN" CNAME 2>/dev/null | head -1)
if [[ "$WWW_CNAME" == *"vercel"* ]]; then
  check "WWW CNAME record" "ok"
else
  check "WWW CNAME record" "fail" "Expected vercel CNAME, got $WWW_CNAME"
fi

# Check SSL
SSL_STATUS=$(curl -sI "https://$PRODUCT_DOMAIN" 2>/dev/null | head -1 | grep -o "[0-9][0-9][0-9]" || echo "000")
if [ "$SSL_STATUS" = "200" ] || [ "$SSL_STATUS" = "301" ] || [ "$SSL_STATUS" = "307" ]; then
  check "SSL Certificate" "ok"
else
  check "SSL Certificate" "fail" "HTTP status $SSL_STATUS"
fi

echo ""
echo "--- Vercel Environment ---"

# Check Vercel env vars exist
VERCEL_ENVS=$(vercel env ls 2>/dev/null || echo "")

check_env() {
  if echo "$VERCEL_ENVS" | grep -q "$1"; then
    check "$1" "ok"
  else
    check "$1" "fail" "Not found in Vercel"
  fi
}

check_env "NEXT_PUBLIC_SUPABASE_URL"
check_env "STRIPE_SECRET_KEY"
check_env "STRIPE_WEBHOOK_SECRET"
check_env "ANTHROPIC_API_KEY"
check_env "GOOGLE_CLIENT_ID"

echo ""
echo "--- Stripe ---"

# Check Stripe products exist
STRIPE_PRODUCTS=$(stripe products list --limit=5 2>/dev/null || echo "error")
if echo "$STRIPE_PRODUCTS" | grep -q "$PRODUCT_NAME"; then
  check "Stripe Product" "ok"
else
  check "Stripe Product" "fail" "Product not found"
fi

# Check webhook
STRIPE_WEBHOOKS=$(stripe webhook_endpoints list 2>/dev/null || echo "error")
if echo "$STRIPE_WEBHOOKS" | grep -q "$PRODUCT_DOMAIN"; then
  check "Stripe Webhook" "ok"
else
  check "Stripe Webhook" "fail" "Webhook not found for $PRODUCT_DOMAIN"
fi

echo ""
echo "--- Supabase ---"

# Check Supabase connection
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  SUPABASE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" 2>/dev/null || echo "000")
  if [ "$SUPABASE_STATUS" = "200" ]; then
    check "Supabase Connection" "ok"
  else
    check "Supabase Connection" "fail" "HTTP $SUPABASE_STATUS"
  fi
else
  check "Supabase Connection" "fail" "URL not configured"
fi

echo ""
echo "--- Email (Resend) ---"

# Check SPF record
SPF_RECORD=$(dig +short "$PRODUCT_DOMAIN" TXT 2>/dev/null | grep "spf1" || echo "")
if echo "$SPF_RECORD" | grep -q "resend.com"; then
  check "SPF Record" "ok"
else
  check "SPF Record" "fail" "Resend not in SPF"
fi

# Check DKIM record
DKIM_RECORD=$(dig +short "resend._domainkey.$PRODUCT_DOMAIN" TXT 2>/dev/null || echo "")
if [ -n "$DKIM_RECORD" ]; then
  check "DKIM Record" "ok"
else
  check "DKIM Record" "fail" "Not found - run add-dkim-record.sh"
fi

echo ""
echo "========================================"
if [ $ERRORS -eq 0 ]; then
  echo "✓ All checks passed! Ready to launch."
else
  echo "✗ $ERRORS issue(s) found. Fix before launch."
fi
echo "========================================"

exit $ERRORS
