#!/bin/bash
# Add DKIM Record for Resend Email via Namecheap API
# Usage: ./scripts/add-dkim-record.sh "p=MIGfMA0GCSqGSIb3DQEB..."
#
# Run this AFTER:
#   1. Running setup-namecheap-dns.sh
#   2. Adding your domain in Resend dashboard
#   3. Copying the DKIM value from Resend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load setup file
if [ ! -f "$PROJECT_DIR/.env.setup" ]; then
  echo "Error: .env.setup not found"
  exit 1
fi

source "$PROJECT_DIR/.env.setup"

DKIM_VALUE="$1"

if [ -z "$DKIM_VALUE" ]; then
  echo "Usage: ./scripts/add-dkim-record.sh \"[DKIM_VALUE]\""
  echo ""
  echo "To get your DKIM value:"
  echo "  1. Go to: https://resend.com/domains"
  echo "  2. Add domain: $PRODUCT_DOMAIN"
  echo "  3. Copy the DKIM record value (starts with 'p=MIGf...')"
  echo "  4. Run this script with that value"
  exit 1
fi

# Extract SLD and TLD
DOMAIN="$PRODUCT_DOMAIN"
SLD="${DOMAIN%.*}"
TLD="${DOMAIN##*.}"

API_URL="https://api.namecheap.com/xml.response"

echo "=== Adding DKIM Record for $DOMAIN ==="
echo ""

# URL encode the values
SPF_RECORD="v=spf1 include:amazonses.com include:resend.com ~all"
SPF_ENCODED=$(echo -n "$SPF_RECORD" | jq -sRr @uri)
DKIM_ENCODED=$(echo -n "$DKIM_VALUE" | jq -sRr @uri)

# Build API call - REPLACES all records, so include existing ones
HOSTS="Command=namecheap.domains.dns.setHosts&SLD=$SLD&TLD=$TLD"
HOSTS="$HOSTS&HostName1=@&RecordType1=A&Address1=76.76.21.21&TTL1=1800"
HOSTS="$HOSTS&HostName2=www&RecordType2=CNAME&Address2=cname.vercel-dns.com.&TTL2=1800"
HOSTS="$HOSTS&HostName3=@&RecordType3=TXT&Address3=$SPF_ENCODED&TTL3=1800"
HOSTS="$HOSTS&HostName4=resend._domainkey&RecordType4=TXT&Address4=$DKIM_ENCODED&TTL4=1800"

echo "Setting records..."

RESPONSE=$(curl -s "$API_URL?ApiUser=$NAMECHEAP_API_USER&ApiKey=$NAMECHEAP_API_KEY&UserName=$NAMECHEAP_USERNAME&ClientIp=$NAMECHEAP_CLIENT_IP&$HOSTS")

if echo "$RESPONSE" | grep -q 'Status="OK"'; then
  echo "✓ DKIM record added successfully!"
  echo ""
  echo "All DNS records now configured:"
  echo "  A     @                → 76.76.21.21"
  echo "  CNAME www              → cname.vercel-dns.com"
  echo "  TXT   @                → SPF record"
  echo "  TXT   resend._domainkey → DKIM record"
  echo ""
  echo "Next steps:"
  echo "  1. Wait 5-30 minutes for DNS propagation"
  echo "  2. Click 'Verify' in Resend dashboard"
  echo "  3. Configure Resend SMTP in Supabase Auth settings"
else
  echo "✗ Error adding DKIM record"
  echo "$RESPONSE" > /tmp/namecheap-response.xml
  echo "Response saved to /tmp/namecheap-response.xml"
  exit 1
fi
