import { createFormattedMessage, MESSAGE_TYPES } from '../utils/messageFormatter';
import { formatCurrency } from '../services/pricingService';

// Configurable promo expiry (UTC). Adjust as needed.
const EARLY_BIRD_EXPIRY = new Date('2025-12-31T23:59:59Z');

// Default pricing (fallback if API is unavailable)
const DEFAULT_PRICING = {
  starter: { priceMonthly: 9.99, name: 'Starter' },
  pro: { priceMonthly: 19.99, name: 'Pro' },
  enterprise: { priceMonthly: 49.99, name: 'Enterprise' }
};

export function daysRemaining(date) {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function isEarlyBirdActive() {
  return daysRemaining(EARLY_BIRD_EXPIRY) > 0;
}

export function EARLY_BIRD_PROMO(pricingData = null) {
  if (!isEarlyBirdActive()) return null;
  
  const days = daysRemaining(EARLY_BIRD_EXPIRY);
  const urgency = days === 0 ? 'Last chance – ends today!' : `Limited time: ${days} day${days === 1 ? '' : 's'} left.`;
  
  // Use provided pricing data or fallback to defaults
  const proTier = pricingData?.tiers?.pro || DEFAULT_PRICING.pro;
  const proPrice = formatCurrency(proTier.priceMonthly);
  const regularPrice = formatCurrency(proTier.originalPriceMonthly || proTier.priceMonthly * 1.33);
  
  return createFormattedMessage(
    `## 🎉 Early Bird Offer – Lock In ${proPrice}/month\n\nYou're part of our first users. Unlock:\n- ✅ Unlimited AI assistance\n- ✅ Priority feature access\n- ✅ Future pro tools included\n\n**${urgency}**\n\nLock this discounted price before it increases to **${regularPrice}**.`,
    MESSAGE_TYPES.INFO,
    [
      {
        id: 'view-pricing',
        label: 'View All Plans',
        icon: '💳',
        variant: 'primary',
        url: '/pricing'
      },
      {
        id: 'subscribe-pro',
        label: `Subscribe to Pro (${proPrice})`,
        icon: '🚀',
        variant: 'secondary',
        action: 'subscribe',
        tierId: 'pro'
      },
      {
        id: 'maybe-later',
        label: 'Maybe Later',
        icon: '👋',
        variant: 'secondary'
      }
    ]
  );
}

export function SUBSCRIPTION_PROMPT(pricingData = null) {
  const proTier = pricingData?.tiers?.pro || DEFAULT_PRICING.pro;
  const starterTier = pricingData?.tiers?.starter || DEFAULT_PRICING.starter;
  
  const proPrice = formatCurrency(proTier.priceMonthly);
  const starterPrice = formatCurrency(starterTier.priceMonthly);
  
  return createFormattedMessage(
    `## Choose Your Plan\n\nYou've reached your free message limit.\n\nContinue building with unlimited access:\n\n**${starterTier.name}** - ${starterPrice}/month\n- 500 messages/month\n- Community support\n\n**${proTier.name}** - ${proPrice}/month ⭐ Popular\n- Unlimited messages\n- Priority support\n- Advanced features`,
    MESSAGE_TYPES.INFO,
    [
      {
        id: 'view-pricing',
        label: 'View All Plans',
        icon: '💳',
        variant: 'primary',
        url: '/pricing'
      },
      {
        id: 'subscribe-starter',
        label: `Start with ${starterTier.name}`,
        icon: '🌟',
        variant: 'secondary',
        action: 'subscribe',
        tierId: 'starter'
      },
      {
        id: 'subscribe-pro',
        label: `Go Pro (${proPrice})`,
        icon: '🚀',
        variant: 'primary',
        action: 'subscribe',
        tierId: 'pro'
      },
      {
        id: 'maybe-later',
        label: 'Maybe Later',
        icon: '👋',
        variant: 'secondary'
      }
    ]
  );
}

export function MULTI_TIER_PROMPT(pricingData = null) {
  const tiers = pricingData?.tiers || DEFAULT_PRICING;
  const hasPromotion = pricingData?.hasActivePromotion || false;
  
  const starterPrice = formatCurrency(tiers.starter?.priceMonthly || DEFAULT_PRICING.starter.priceMonthly);
  const proPrice = formatCurrency(tiers.pro?.priceMonthly || DEFAULT_PRICING.pro.priceMonthly);
  const enterprisePrice = formatCurrency(tiers.enterprise?.priceMonthly || DEFAULT_PRICING.enterprise.priceMonthly);
  
  const promoText = hasPromotion ? '\n\n🎉 **Limited Time Offer** - Special pricing available!' : '';
  
  return createFormattedMessage(
    `## Upgrade to Continue\n\nChoose the plan that fits your needs:${promoText}\n\n**Starter** - ${starterPrice}/month\n• 500 messages/month\n• Community support\n\n**Pro** - ${proPrice}/month ⭐ Most Popular\n• Unlimited messages\n• Priority support\n• Advanced features\n\n**Enterprise** - ${enterprisePrice}/month\n• Everything in Pro\n• Dedicated support\n• Custom features`,
    MESSAGE_TYPES.INFO,
    [
      {
        id: 'view-pricing',
        label: 'Compare All Plans',
        icon: '📊',
        variant: 'primary',
        url: '/pricing'
      },
      {
        id: 'subscribe-starter',
        label: 'Choose Starter',
        icon: '🌟',
        variant: 'secondary',
        action: 'subscribe',
        tierId: 'starter'
      },
      {
        id: 'subscribe-pro',
        label: 'Choose Pro',
        icon: '🚀',
        variant: 'primary',
        action: 'subscribe',
        tierId: 'pro'
      },
      {
        id: 'subscribe-enterprise',
        label: 'Choose Enterprise',
        icon: '🏢',
        variant: 'secondary',
        action: 'subscribe',
        tierId: 'enterprise'
      }
    ]
  );
}

// Helper to choose best prompt based on context
export function getPaywallPrompt(pricingData = null, context = 'default') {
  // If we have pricing data, show multi-tier prompt
  if (pricingData?.tiers && Object.keys(pricingData.tiers).length > 1) {
    // Check if early bird promotion is active and should be shown
    if (isEarlyBirdActive() && context === 'first-time') {
      const promo = EARLY_BIRD_PROMO(pricingData);
      if (promo) return promo;
    }
    
    return MULTI_TIER_PROMPT(pricingData);
  }
  
  // Fallback to original logic
  const promo = EARLY_BIRD_PROMO(pricingData);
  return promo || SUBSCRIPTION_PROMPT(pricingData);
}
