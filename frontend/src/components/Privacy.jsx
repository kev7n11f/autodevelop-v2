import './Pages.css';

export default function Privacy() {
  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Privacy Policy</h1>
        <p className="page-subtitle">Your privacy is important to us. This policy explains what we collect, why, how we use it, and the controls you have.</p>
      </div>

      <div className="content-card">
        {/* Introduction */}
        <div className="privacy-section">
          <h2>🔒 Overview</h2>
          <p>
            At AutoDevelop.ai we collect only the data necessary to provide: (1) AI assisted development features, (2) subscription / usage limit enforcement, and (3) optional product update communications (mailing list). We deliberately separate mailing list data from subscription and usage data. We do not sell personal data.
          </p>
        </div>

        {/* Data Categories */}
        <div className="privacy-section">
          <h3>1. Data We Collect</h3>
          <ul className="styled-list">
            <li><strong>Chat Interactions:</strong> The prompts/messages you send (processed to generate responses and for limited abuse prevention).</li>
            <li><strong>Usage & Subscription Data:</strong> Message counts (daily/monthly), timestamps of resets, subscription status, Stripe customer & subscription IDs (no full card data—Stripe handles billing details).</li>
            <li><strong>Mailing List Data (Optional):</strong> Email, optional name, status (pending/confirmed/unsubscribed), confirmation & unsubscribe tokens, consent version, minimal action timestamps (subscribe, confirmation sent, unsubscribe request), and limited metadata (IP, user agent, source) for fraud/spam prevention.</li>
            <li><strong>Security & Audit Logs:</strong> Usage events (message_used, limit_block, usage_reset, diagnostic_access) and Stripe webhook event metadata (event id, type, status) for resiliency and compliance.</li>
            <li><strong>Technical Information:</strong> IP address, browser/user agent, device / optional client identifier header for rate limiting and abuse mitigation.</li>
            <li><strong>Support / Contact Data:</strong> Information you voluntarily submit via forms or email.</li>
            <li><strong>Cookies:</strong> Essential session / security cookies and privacy‑focused analytics (see Cookie Policy). No tracking cookies for the mailing list flows.</li>
          </ul>
        </div>

        {/* Separation Explanation */}
        <div className="privacy-section">
          <h3>2. Data Separation</h3>
          <ul className="styled-list">
            <li>Mailing list records reside in a dedicated table and never modify usage counters or Stripe subscription data.</li>
            <li>Unsubscribing from mailing list updates does not affect your ability to use the platform or your paid subscription.</li>
            <li>Stripe subscription state is used only to determine feature/limit access—not for marketing without consent.</li>
          </ul>
        </div>

        {/* Use of Data */}
        <div className="privacy-section">
          <h3>3. How We Use Your Information</h3>
          <ul className="styled-list">
            <li>Provide and improve AI development functionality.</li>
            <li>Enforce free tier daily/monthly limits and enable upgraded limits for subscribers.</li>
            <li>Process payments and manage subscriptions via Stripe.</li>
            <li>Send optional product / feature update emails (only if you confirmed your mailing list subscription).</li>
            <li>Maintain security (rate limiting, abuse detection, anomaly review).</li>
            <li>Diagnose issues and generate internal metrics (aggregate/anonymous where feasible).</li>
            <li>Comply with legal obligations and respond to lawful requests.</li>
          </ul>
        </div>

        {/* Legal Bases */}
        <div className="privacy-section">
          <h3>4. Legal Bases (GDPR)</h3>
          <ul className="styled-list">
            <li><strong>Contract:</strong> Core platform features, subscription management.</li>
            <li><strong>Consent:</strong> Mailing list (double opt‑in), optional analytics preferences (where applicable).</li>
            <li><strong>Legitimate Interests:</strong> Security logging, fraud prevention, service improvement (balanced with your rights).</li>
            <li><strong>Legal Obligation:</strong> Compliance, tax, and accounting retention requirements.</li>
          </ul>
        </div>

        {/* Data Security */}
        <div className="privacy-section">
          <h3>5. Data Security</h3>
          <ul className="styled-list">
            <li>Industry-standard encryption in transit; restricted access internally.</li>
            <li>Audit trail for usage and billing event processing.</li>
            <li>Resilient webhook storage prevents duplicate side effects.</li>
            <li>Tokenized unsubscribe & confirmation links (revoked upon status change).</li>
          </ul>
        </div>

        {/* Retention */}
        <div className="privacy-section">
          <h3>6. Data Retention</h3>
          <ul className="styled-list">
            <li>Usage counters reset on rolling daily/monthly windows (historical aggregates retained in audit events).</li>
            <li>Mailing list subscriber data retained until deletion request or (after a defined dormancy period) anonymization.</li>
            <li>Audit / security logs retained for a limited period required for fraud prevention and compliance, then aggregated or deleted.</li>
            <li>Stripe billing records retained per financial/legal requirements.</li>
          </ul>
        </div>

        {/* Your Rights */}
        <div className="privacy-section">
          <h3>7. Your Rights</h3>
          <p>You may:</p>
          <ul className="styled-list">
            <li>Access, correct, or request deletion of your personal data.</li>
            <li>Unsubscribe from update emails at any time via one‑click token link.</li>
            <li>Request mailing list data deletion via the public API endpoint.</li>
            <li>Object to or restrict certain processing (e.g., direct marketing).</li>
            <li>Port basic account / subscription data where technically feasible.</li>
          </ul>
        </div>

        {/* Mailing List Specific */}
        <div className="privacy-section">
          <h3>8. Mailing List Specifics</h3>
          <ul className="styled-list">
            <li>Double opt‑in required: pending until you confirm via emailed link.</li>
            <li>We store a consent version to evidence what text you agreed to.</li>
            <li>Rate limiting metadata prevents token abuse—minimal timestamps only.</li>
            <li>Resubscription regenerates tokens; prior tokens invalidated.</li>
            <li>No tracking pixels or ad cookies added by our own templates.</li>
          </ul>
        </div>

        {/* International Transfers */}
        <div className="privacy-section">
          <h3>9. International Transfers</h3>
          <p>Data may be processed in the United States and other jurisdictions by vetted sub‑processors (e.g., Stripe for billing, SendGrid for email, infrastructure providers). Safeguards such as Standard Contractual Clauses are applied where required.</p>
        </div>

        {/* Children's Privacy */}
        <div className="privacy-section">
          <h3>10. Children's Privacy</h3>
          <p>Our service is not directed to children under 13 and we do not knowingly collect data from them. Contact us if you believe a minor has provided data.</p>
        </div>

        {/* Changes */}
        <div className="privacy-section">
          <h3>11. Updates to This Policy</h3>
          <p>Material changes will be announced via in‑app notice or email (if subscribed). The latest version supersedes prior versions.</p>
        </div>

        {/* Contact */}
        <div className="privacy-section">
          <h3>12. Contact Us</h3>
          <ul className="styled-list">
            <li><strong>Privacy:</strong> privacy@autodevelop.ai</li>
            <li><strong>Security:</strong> security@autodevelop.ai</li>
            <li><strong>Support:</strong> support@autodevelop.ai</li>
          </ul>
        </div>

        <div className="last-updated">
          <p><em>Last Updated: January 2025</em></p>
        </div>
      </div>
    </div>
  );
}
