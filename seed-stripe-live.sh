#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env"

# ==== CHECKS ====
if [ -z "${STRIPE_LIVE_KEY:-}" ]; then
  echo "❌ STRIPE_LIVE_KEY not set. Run: export STRIPE_LIVE_KEY=sk_live_..."
  exit 1
fi

command -v jq >/dev/null || { echo "❌ Please install jq"; exit 1; }

# ==== GENERATE JWT_SECRET ====
JWT_SECRET=$(openssl rand -base64 32)
echo "🔑 JWT_SECRET generated"

# ==== FUNCTION TO CREATE PRODUCT & PRICES ====
create_product_and_prices () {
  local NAME="$1"
  local DESC="$2"
  local MONTHLY_AMOUNT="$3"  # cents
  local YEARLY_AMOUNT="$4"   # cents
  local ENV_PREFIX="$5"

  echo "📦 Creating product: $NAME..."
  PRODUCT_ID=$(stripe --api-key "$STRIPE_LIVE_KEY" products create \
    --name "$NAME" \
    --description "$DESC" \
    --json | jq -r '.id')

  echo "💲 Creating monthly price..."
  PRICE_MONTHLY_ID=$(stripe --api-key "$STRIPE_LIVE_KEY" prices create \
    --unit-amount "$MONTHLY_AMOUNT" \
    --currency usd \
    --recurring interval=month \
    --product "$PRODUCT_ID" \
    --json | jq -r '.id')

  echo "💲 Creating yearly price..."
  PRICE_YEARLY_ID=$(stripe --api-key "$STRIPE_LIVE_KEY" prices create \
    --unit-amount "$YEARLY_AMOUNT" \
    --currency usd \
    --recurring interval=year \
    --product "$PRODUCT_ID" \
    --json | jq -r '.id')

  # Write to .env
  {
    echo "${ENV_PREFIX}_PRICE_ID=$PRICE_MONTHLY_ID"
    echo "${ENV_PREFIX}_YEARLY_PRICE_ID=$PRICE_YEARLY_ID"
  } >> "$ENV_FILE"

  echo "✅ $NAME setup complete"
}

# ==== CREATE PRODUCTS FROM DOC ====
create_product_and_prices \
  "AutoDevelop Starter" \
  "500 messages/month, code generation assistance" \
  799 7990 STRIPE_STARTER

create_product_and_prices \
  "AutoDevelop Pro" \
  "Unlimited messages, API access, early features" \
  1499 14990 STRIPE_PRO

create_product_and_prices \
  "AutoDevelop Enterprise" \
  "Dedicated support, SLA, analytics" \
  3999 39990 STRIPE_ENTERPRISE

# ==== APPEND JWT_SECRET & DEFAULT_PRICE_ID ====
echo "JWT_SECRET=$JWT_SECRET" >> "$ENV_FILE"
echo "STRIPE_DEFAULT_PRICE_ID=$(grep STRIPE_PRO_PRICE_ID "$ENV_FILE" | cut -d= -f2)" >> "$ENV_FILE"

echo "🎉 All tiers created in LIVE mode and .env updated"
