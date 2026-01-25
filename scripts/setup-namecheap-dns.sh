#!/bin/bash
# Setup DNS Records via Namecheap API
# Usage: ./scripts/setup-namecheap-dns.sh
#
# Prerequisites:
#   1. Enable API access in Namecheap: Profile → Tools → API Access
#   2. Whitelist your IP address
#   3. Fill in Namecheap credentials in .env.setup

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load setup file
if [ ! -f "$PROJECT_DIR/.env.setup" ]; then
  echo "Error: .env.setup not found"
  exit 1
fi

source "$PROJECT_DIR/.env.setup"

# Validate Namecheap credentials
if [ -z "$NAMECHEAP_API_USER" ] || [ -z "$NAMECHEAP_API_KEY" ]; then
  echo "Error: Namecheap API credentials not set in .env.setup"
  echo ""
  echo "To enable Namecheap API:"
  echo "  1. Go to: https://www.namecheap.com/myaccount/settings/tools/apiaccess/"
  echo "  2. Enable API Access"
  echo "  3. Whitelist your IP: $(curl -s ifconfig.me)"
  echo "  4. Copy API Key to .env.setup"
  exit 1
fi

# Extract SLD and TLD from domain
DOMAIN="$PRODUCT_DOMAIN"
SLD="${DOMAIN%.*}"
TLD="${DOMAIN##*.}"

API_URL="https://api.namecheap.com/xml.response"

echo "=== Setting up DNS for $DOMAIN ==="
echo "SLD: $SLD, TLD: $TLD"
echo ""

# Function to call Namecheap API
namecheap_api() {
  curl -s "$API_URL?ApiUser=$NAMECHEAP_API_USER&ApiKey=$NAMECHEAP_API_KEY&UserName=$NAMECHEAP_USERNAME&ClientIp=$NAMECHEAP_CLIENT_IP&$1"
}

# Check current IP matches whitelisted IP
CURRENT_IP=$(curl -s ifconfig.me)
if [ "$CURRENT_IP" != "$NAMECHEAP_CLIENT_IP" ]; then
  echo "⚠️  Warning: Your current IP ($CURRENT_IP) differs from NAMECHEAP_CLIENT_IP ($NAMECHEAP_CLIENT_IP)"
  echo "Update .env.setup or whitelist your current IP in Namecheap."
  echo ""
  echo "Press Enter to try anyway, or Ctrl+C to cancel..."
  read
fi

echo "Setting DNS records..."
echo "  A     @    → 76.76.21.21 (Vercel)"
echo "  CNAME www  → cname.vercel-dns.com"
echo "  TXT   @    → SPF record for Resend"
echo ""

# URL encode the SPF record value
SPF_RECORD="v=spf1 include:amazonses.com include:resend.com ~all"
SPF_ENCODED=$(echo -n "$SPF_RECORD" | jq -sRr @uri)

# Build API call - Note: setHosts REPLACES all records
HOSTS="Command=namecheap.domains.dns.setHosts&SLD=$SLD&TLD=$TLD"
HOSTS="$HOSTS&HostName1=@&RecordType1=A&Address1=76.76.21.21&TTL1=1800"
HOSTS="$HOSTS&HostName2=www&RecordType2=CNAME&Address2=cname.vercel-dns.com.&TTL2=1800"
HOSTS="$HOSTS&HostName3=@&RecordType3=TXT&Address3=$SPF_ENCODED&TTL3=1800"

# Also add email MX records if using custom email
# Uncomment if needed:
# HOSTS="$HOSTS&HostName4=@&RecordType4=MX&Address4=mx1.privateemail.com.&MXPref4=10&TTL4=1800"

RESPONSE=$(namecheap_api "$HOSTS")

# Check response
if echo "$RESPONSE" | grep -q 'Status="OK"'; then
  echo "✓ DNS records set successfully!"
  echo ""
  echo "Records configured:"
  echo "  A     @     → 76.76.21.21 (Vercel)"
  echo "  CNAME www   → cname.vercel-dns.com"
  echo "  TXT   @     → $SPF_RECORD"
  echo ""
  echo "DNS propagation may take 5-30 minutes."
  echo ""
  echo "⚠️  DKIM record still needed for Resend email:"
  echo "  1. Add domain in Resend dashboard"
  echo "  2. Copy the DKIM value"
  echo "  3. Run: ./scripts/add-dkim-record.sh \"[DKIM_VALUE]\""
else
  echo "✗ Error setting DNS records:"
  echo ""
  # Extract error message
  ERROR=$(echo "$RESPONSE" | grep -o 'Number="[^"]*"' | head -1)
  MESSAGE=$(echo "$RESPONSE" | grep -o '<Error>[^<]*</Error>' | sed 's/<[^>]*>//g')
  echo "Error: $ERROR"
  echo "Message: $MESSAGE"
  echo ""
  echo "Full response saved to /tmp/namecheap-response.xml"
  echo "$RESPONSE" > /tmp/namecheap-response.xml
  exit 1
fi
