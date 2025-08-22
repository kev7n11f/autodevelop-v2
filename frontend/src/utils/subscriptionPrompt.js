import { createFormattedMessage, MESSAGE_TYPES } from '../utils/messageFormatter';

// Configurable promo expiry (UTC). Adjust as needed.
const EARLY_BIRD_EXPIRY = new Date('2025-12-31T23:59:59Z');
const PROMO_PRICE = '$3.99/month';
const REGULAR_PRICE = '$5.99/month'; // For future comparison messaging

export function daysRemaining(date) {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function isEarlyBirdActive() {
  return daysRemaining(EARLY_BIRD_EXPIRY) > 0;
}

export function EARLY_BIRD_PROMO() {
  if (!isEarlyBirdActive()) return null;
  const days = daysRemaining(EARLY_BIRD_EXPIRY);
  const urgency = days === 0 ? 'Last chance – ends today!' : `Limited time: ${days} day${days === 1 ? '' : 's'} left.`;
  return createFormattedMessage(
    `## 🎉 Early Bird Offer – Lock In ${PROMO_PRICE}\n\nYou're part of our first users. Unlock:\n- ✅ Unlimited AI assistance\n- ✅ Priority feature access\n- ✅ Future pro tools included\n\n**${urgency}**\n\nLock this discounted price before it increases to **${REGULAR_PRICE}**.`,
    MESSAGE_TYPES.INFO,
    [
      {
        id: 'subscribe-now',
        label: 'Subscribe Now',
        icon: '💳',
        variant: 'primary',
        url: '/subscribe'
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

export function SUBSCRIPTION_PROMPT() {
  return createFormattedMessage(
    `## Subscribe to Continue\n\nYou've reached your free message limit.\n\nContinue building with unlimited access for **${PROMO_PRICE}**.\n\n**Included:**\n- Unlimited AI assistance\n- Priority improvements\n- Access to new features`,
    MESSAGE_TYPES.INFO,
    [
      {
        id: 'subscribe-now',
        label: 'Subscribe Now',
        icon: '💳',
        variant: 'primary',
        url: '/subscribe'
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

// Helper to choose best prompt
export function getPaywallPrompt() {
  const promo = EARLY_BIRD_PROMO();
  return promo || SUBSCRIPTION_PROMPT();
}
