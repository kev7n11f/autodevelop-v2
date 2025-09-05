#!/usr/bin/env bash
set -e

# ----------------------------
# Load environment variables
# ----------------------------
set -a
source .env
set +a

# Use the Stripe API key from env
STRIPE_KEY="$STRIPE_API_KEY"

# Path to your .env file
ENV_FILE=".env"

# Product + price definitions
declare -A PRODUCTS=(
  ["starter"]="Starter Plan"
  ["pro"]="Pro Plan"
  ["enterprise"]="Enterprise Plan"
)

declare -A MONTHLY_PRICES=(
  ["starter"]=999      # $9.99
  ["pro"]=1999         # $19.99
  ["enterprise"]=4999  # $49.99
)

declare -A YEARLY_PRICES=(
  ["starter"]=9999       # $99.99
  ["pro"]=19999          # $199.99
  ["enterprise"]=49999   # $499.99
)

# ----------------------------
# Function to create product + prices
# ----------------------------
create_product_and_prices() {
  local key=$1
  local name=$2
  local monthly=${MONTHLY_PRICES[$key]}
  local yearly=${YEARLY_PRICES[$key]}

  echo "Creating product: $name"

  # Create product
  PRODUCT_ID=$(./stripe.exe products create \
    --name "$name" \
    --description "$name subscription" \
    --active true \
    --api-key "$STRIPE_KEY" \
    --query "id" --output tsv)

  # Create monthly price
  PRICE_MONTHLY=$(./stripe.exe prices create \
    --product "$PRODUCT_ID" \
    --unit-amount $monthly \
    --currency usd \
    --recurring interval=month \
    --nickname "$name Monthly" \
    --api-key "$STRIPE_KEY" \
    --query "id" --output tsv)

  # Create yearly price
  PRICE_YEARLY=$(./stripe.exe prices create \
    --product "$PRODUCT_ID" \
    --unit-amount $yearly \
    --currency usd \
    --recurring interval=year \
    --nickname "$name Yearly" \
    --api-key "$STRIPE_KEY" \
    --query "id" --output tsv)

  # Append env lines directly
  {
    echo "STRIPE_${key^^}_PRICE_ID=$PRICE_MONTHLY"
    echo "STRIPE_${key^^}_YEARLY_PRICE_ID=$PRICE_YEARLY"
  } >> "$ENV_FILE"
}

# ----------------------------
# Main script
# ----------------------------
echo "# Seeding Stripe products & prices into $ENV_FILE ..."
echo "" >> "$ENV_FILE"  # Ensure newline at end

for plan in "${!PRODUCTS[@]}"; do
  create_product_and_prices "$plan" "${PRODUCTS[$plan]}"
done

echo "✅ Stripe seed complete. IDs are now in $ENV_FILE"