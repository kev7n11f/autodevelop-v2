import { useState, useEffect } from 'react';
import { handleUpgrade } from '../utils/upgradeUtils';
import './UsageBar.css';

export default function UsageBar({ isVisible = true }) {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get usage info from the last chat response meta data
    const lastChatMeta = sessionStorage.getItem('lastChatMeta');
    if (lastChatMeta) {
      try {
        const meta = JSON.parse(lastChatMeta);
        setUsage({
          dailyUsed: (meta.freeDailyLimit || 5) - (meta.remainingDailyFree || 0),
          dailyLimit: meta.freeDailyLimit || 5,
          monthlyUsed: (meta.freeMonthlyLimit || 150) - (meta.remainingMonthlyFree || 0),
          monthlyLimit: meta.freeMonthlyLimit || 150,
          remainingDaily: meta.remainingDailyFree || 0,
          remainingMonthly: meta.remainingMonthlyFree || 0,
          subscribed: meta.subscribed || false
        });
      } catch (e) {
        console.warn('Failed to parse chat meta:', e);
      }
    }
    setLoading(false);
  }, []);

  if (!isVisible || loading || !usage || usage.subscribed) {
    return null;
  }

  const dailyPercentage = Math.min((usage.dailyUsed / usage.dailyLimit) * 100, 100);
  const monthlyPercentage = Math.min((usage.monthlyUsed / usage.monthlyLimit) * 100, 100);
  
  const isNearDailyLimit = usage.remainingDaily <= 1;
  const isNearMonthlyLimit = usage.remainingMonthly <= 10;

  return (
    <div className={`usage-bar ${isNearDailyLimit || isNearMonthlyLimit ? 'usage-bar-warning' : ''}`}>
      <div className="usage-header">
        <h4>📊 Free Usage Remaining</h4>
        {(isNearDailyLimit || isNearMonthlyLimit) && (
          <span className="usage-warning">⚠️ Close to limit</span>
        )}
      </div>
      
      <div className="usage-stats">
        <div className="usage-stat">
          <div className="usage-label">
            <span>Daily Messages</span>
            <span className="usage-count">{usage.remainingDaily} / {usage.dailyLimit}</span>
          </div>
          <div className="usage-progress">
            <div 
              className={`usage-fill ${dailyPercentage >= 80 ? 'usage-fill-warning' : ''} ${dailyPercentage >= 100 ? 'usage-fill-danger' : ''}`}
              style={{ width: `${dailyPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="usage-stat">
          <div className="usage-label">
            <span>Monthly Messages</span>
            <span className="usage-count">{usage.remainingMonthly} / {usage.monthlyLimit}</span>
          </div>
          <div className="usage-progress">
            <div 
              className={`usage-fill ${monthlyPercentage >= 80 ? 'usage-fill-warning' : ''} ${monthlyPercentage >= 100 ? 'usage-fill-danger' : ''}`}
              style={{ width: `${monthlyPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {(usage.remainingDaily <= 0 || usage.remainingMonthly <= 0) && (
        <div className="usage-upgrade-prompt">
          <p>You've reached your free limit. Upgrade to continue chatting!</p>
          <button 
            className="btn btn-primary btn-sm"
            onClick={handleUpgrade}
          >
            🚀 Upgrade Now
          </button>
        </div>
      )}
    </div>
  );
}