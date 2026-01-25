#!/bin/bash
# Create Stripe Products and Prices for CoachReflection
# Usage: ./scripts/setup-stripe-products.sh
#
# Prerequisites:
#   1. Install Stripe CLI: brew install stripe/stripe-cli/stripe
#   2. Login: stripe login
#   3. Switch to live mode: stripe config --live
#   4. Fill in .env.setup with pricing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load setup file
if [ ! -f "$PROJECT_DIR/.env.setup" ]; then
  echo "Error: .env.setup not found"
  exit 1
fi

source "$PROJECT_DIR/.env.setup"

echo "=== Creating Stripe Products for $PRODUCT_NAME ==="
echo ""

# Check if stripe CLI is installed
if ! command -v stripe &> /dev/null; then
  echo "Error: Stripe CLI not installed"
  echo "Install with: brew install stripe/stripe-cli/stripe"
  exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo "Error: jq not installed"
  echo "Install with: brew install jq"
  exit 1
fi

# Confirm live mode
echo "⚠️  This will create LIVE Stripe products (real money)."
echo "Press Enter to continue or Ctrl+C to cancel..."
read

echo "Creating product..."
PRODUCT_RESPONSE=$(stripe products create \
  --name="$PRODUCT_NAME Pro" \
  --description="$PRODUCT_DESCRIPTION" \
  --metadata[product]="$PRODUCT_NAME" \
  --format=json 2>&1)

PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | jq -r '.id // empty')

if [ -z "$PRODUCT_ID" ]; then
  echo "Error creating product:"
  echo "$PRODUCT_RESPONSE"
  exit 1
fi

echo "✓ Created product: $PRODUCT_ID"

echo ""
echo "Creating monthly price (\$$(echo "scale=2; $PRICE_PRO_MONTHLY / 100" | bc)/month)..."
MONTHLY_RESPONSE=$(stripe prices create \
  --product="$PRODUCT_ID" \
  --unit-amount="$PRICE_PRO_MONTHLY" \
  --currency=usd \
  --recurring[interval]=month \
  --metadata[type]=pro_monthly \
  --format=json 2>&1)

MONTHLY_PRICE_ID=$(echo "$MONTHLY_RESPONSE" | jq -r '.id // empty')

if [ -z "$MONTHLY_PRICE_ID" ]; then
  echo "Error creating monthly price:"
  echo "$MONTHLY_RESPONSE"
  exit 1
fi

echo "✓ Monthly price: $MONTHLY_PRICE_ID"

echo ""
echo "Creating annual price (\$$(echo "scale=2; $PRICE_PRO_ANNUAL / 100" | bc)/year)..."
ANNUAL_RESPONSE=$(stripe prices create \
  --product="$PRODUCT_ID" \
  --unit-amount="$PRICE_PRO_ANNUAL" \
  --currency=usd \
  --recurring[interval]=year \
  --metadata[type]=pro_annual \
  --format=json 2>&1)

ANNUAL_PRICE_ID=$(echo "$ANNUAL_RESPONSE" | jq -r '.id // empty')

if [ -z "$ANNUAL_PRICE_ID" ]; then
  echo "Error creating annual price:"
  echo "$ANNUAL_RESPONSE"
  exit 1
fi

echo "✓ Annual price: $ANNUAL_PRICE_ID"

echo ""
echo "=== Adding price IDs to Vercel ==="

# Add to Vercel
vercel env rm "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID" production --yes 2>/dev/null || true
echo "$MONTHLY_PRICE_ID" | vercel env add "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID" production --yes
echo "✓ NEXT_PUBLIC_STRIPE_PRO_PRICE_ID"

vercel env rm "NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID" production --yes 2>/dev/null || true
echo "$ANNUAL_PRICE_ID" | vercel env add "NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID" production --yes
echo "✓ NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID"

echo ""
echo "=== Stripe products setup complete! ==="
echo ""
echo "Summary:"
echo "  Product ID:     $PRODUCT_ID"
echo "  Monthly Price:  $MONTHLY_PRICE_ID (\$$(echo "scale=2; $PRICE_PRO_MONTHLY / 100" | bc)/month)"
echo "  Annual Price:   $ANNUAL_PRICE_ID (\$$(echo "scale=2; $PRICE_PRO_ANNUAL / 100" | bc)/year)"
echo ""
echo "Next: Run ./scripts/setup-stripe-webhook.sh"
