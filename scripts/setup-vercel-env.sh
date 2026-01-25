#!/bin/bash
# Setup Vercel Environment Variables for CoachReflection
# Usage: ./scripts/setup-vercel-env.sh
#
# Prerequisites:
#   1. Install Vercel CLI: npm i -g vercel
#   2. Login: vercel login
#   3. Link project: vercel link
#   4. Fill in .env.setup with your values

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load setup file
if [ ! -f "$PROJECT_DIR/.env.setup" ]; then
  echo "Error: .env.setup not found"
  echo "Copy .env.setup.template to .env.setup and fill in your values"
  exit 1
fi

source "$PROJECT_DIR/.env.setup"

echo "=== Setting up Vercel Environment Variables for $PRODUCT_NAME ==="
echo ""

# Function to add env var (handles existing vars)
add_env() {
  local name=$1
  local value=$2
  local env=${3:-production}

  if [ -z "$value" ]; then
    echo "⚠️  Skipping $name (empty value)"
    return
  fi

  # Remove existing var first (ignore errors if doesn't exist)
  vercel env rm "$name" "$env" --yes 2>/dev/null || true

  # Add new value
  echo "$value" | vercel env add "$name" "$env" --yes
  echo "✓ $name"
}

echo "--- Core ---"
add_env "NEXT_PUBLIC_APP_URL" "https://$PRODUCT_DOMAIN"

echo ""
echo "--- Supabase ---"
add_env "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL"
add_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
add_env "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"

echo ""
echo "--- Stripe ---"
add_env "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
add_env "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"

echo ""
echo "--- AI ---"
add_env "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY"
add_env "OPENAI_API_KEY" "$OPENAI_API_KEY"

echo ""
echo "--- Google OAuth ---"
add_env "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID"
add_env "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET"

echo ""
echo "--- Upstash (Rate Limiting) ---"
add_env "UPSTASH_REDIS_REST_URL" "$UPSTASH_REDIS_REST_URL"
add_env "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN"

echo ""
echo "--- Email (Resend) ---"
add_env "RESEND_API_KEY" "$RESEND_API_KEY"

echo ""
echo "--- Error Tracking (Sentry) ---"
add_env "SENTRY_DSN" "$SENTRY_DSN"

echo ""
echo "--- App Config ---"
add_env "ADMIN_EMAILS" "$ADMIN_EMAILS"

# Generate a random CRON_SECRET if not provided
if [ -z "$CRON_SECRET" ]; then
  CRON_SECRET=$(openssl rand -hex 32)
  echo "Generated CRON_SECRET (save this): $CRON_SECRET"
fi
add_env "CRON_SECRET" "$CRON_SECRET"

echo ""
echo "=== Vercel env vars setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Run ./scripts/setup-stripe-products.sh to create Stripe products"
echo "  2. Run ./scripts/setup-stripe-webhook.sh to create webhook"
echo "  3. Deploy: vercel --prod"
