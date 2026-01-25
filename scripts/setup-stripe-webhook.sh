#!/bin/bash
# Create Stripe Webhook for CoachReflection
# Usage: ./scripts/setup-stripe-webhook.sh
#
# Prerequisites:
#   1. Stripe CLI installed and logged in
#   2. Domain configured and accessible

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load setup file
if [ ! -f "$PROJECT_DIR/.env.setup" ]; then
  echo "Error: .env.setup not found"
  exit 1
fi

source "$PROJECT_DIR/.env.setup"

WEBHOOK_URL="https://$PRODUCT_DOMAIN/api/stripe/webhook"

echo "=== Creating Stripe Webhook ==="
echo "URL: $WEBHOOK_URL"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo "Error: jq not installed"
  echo "Install with: brew install jq"
  exit 1
fi

# First, check if domain is reachable
echo "Checking if domain is accessible..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$PRODUCT_DOMAIN" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "000" ]; then
  echo "⚠️  Warning: $PRODUCT_DOMAIN is not reachable yet."
  echo "The webhook will be created but may fail until the domain is live."
  echo ""
  echo "Press Enter to continue anyway, or Ctrl+C to cancel..."
  read
fi

echo ""
echo "Creating webhook endpoint..."

WEBHOOK_RESPONSE=$(stripe webhook_endpoints create \
  --url="$WEBHOOK_URL" \
  --enabled-events="checkout.session.completed" \
  --enabled-events="customer.subscription.created" \
  --enabled-events="customer.subscription.updated" \
  --enabled-events="customer.subscription.deleted" \
  --enabled-events="invoice.payment_succeeded" \
  --enabled-events="invoice.payment_failed" \
  --format=json 2>&1)

WEBHOOK_ID=$(echo "$WEBHOOK_RESPONSE" | jq -r '.id // empty')
WEBHOOK_SECRET=$(echo "$WEBHOOK_RESPONSE" | jq -r '.secret // empty')

if [ -z "$WEBHOOK_ID" ] || [ -z "$WEBHOOK_SECRET" ]; then
  echo "Error creating webhook:"
  echo "$WEBHOOK_RESPONSE"
  exit 1
fi

echo "✓ Webhook created: $WEBHOOK_ID"
echo ""

echo "Adding webhook secret to Vercel..."
vercel env rm "STRIPE_WEBHOOK_SECRET" production --yes 2>/dev/null || true
echo "$WEBHOOK_SECRET" | vercel env add "STRIPE_WEBHOOK_SECRET" production --yes
echo "✓ STRIPE_WEBHOOK_SECRET added to Vercel"

echo ""
echo "=== Stripe webhook setup complete! ==="
echo ""
echo "Summary:"
echo "  Webhook ID:     $WEBHOOK_ID"
echo "  Webhook URL:    $WEBHOOK_URL"
echo "  Secret:         $WEBHOOK_SECRET"
echo ""
echo "Events enabled:"
echo "  - checkout.session.completed"
echo "  - customer.subscription.created"
echo "  - customer.subscription.updated"
echo "  - customer.subscription.deleted"
echo "  - invoice.payment_succeeded"
echo "  - invoice.payment_failed"
echo ""
echo "⚠️  SAVE THE WEBHOOK SECRET - you won't be able to see it again in the Stripe dashboard"
