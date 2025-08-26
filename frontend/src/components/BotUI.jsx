import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './BotUI.css';
import EnhancedMessageBubble from './EnhancedMessageBubble';
import { 
  createFormattedMessage, 
  ERROR_TEMPLATES, 
  MESSAGE_TYPES 
} from '../utils/messageFormatter';
import { getPaywallPrompt } from '../utils/subscriptionPrompt';
import { useAuth } from '../contexts/AuthContext';

export default function BotUI() {
  const { isAuthenticated, user, loginWithGoogle } = useAuth();
  const [input, setInput] = useState('');
  const [log, setLog] = useState([
    createFormattedMessage('Hello! I\'m your AI development assistant. How can I help you bring your ideas to life today?', MESSAGE_TYPES.NORMAL)
  ]);
  const FREE_MESSAGE_LIMIT = 5;
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);
  const [paywallDismissed, setPaywallDismissed] = useState(() => {
    try { return localStorage.getItem('paywallDismissed') === '1'; } catch { return false; }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const messagesEndRef = useRef(null);
  const liveRegionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    // Accessibility: announce latest bot message
    const last = log[log.length - 1];
    if (last && last.from === 'bot' && liveRegionRef.current) {
      liveRegionRef.current.textContent = last.text?.slice(0, 300) || '';
    }
  }, [log]);

  // Fetch subscription status when user changes or authenticates
  const fetchSubscription = useCallback(async () => {
      if (!isAuthenticated || !user?.id) {
        setIsSubscribed(false);
        return;
      }
      try {
        setCheckingSubscription(true);
        const res = await fetch(`/api/payments/subscription/${user.id}`);
        if (res.ok) {
          const data = await res.json();
            if (data?.subscription?.status === 'active') {
              setIsSubscribed(true);
              setSubscriptionRequired(false);
            } else {
              setIsSubscribed(false);
            }
        } else if (res.status === 404) {
          setIsSubscribed(false);
        }
      } catch (e) {
        console.warn('Failed to check subscription status', e);
      } finally {
        setCheckingSubscription(false);
      }
    }, [isAuthenticated, user?.id]);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  // Detect Stripe checkout success (session_id param) and refresh subscription
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      // Remove param silently
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      // Re-check subscription after short delay (Stripe webhook processing time)
      setTimeout(() => fetchSubscription(), 1500);
    }
  }, [fetchSubscription]);

  const startCheckout = async () => {
    if (!isAuthenticated) {
      loginWithGoogle();
      return;
    }
    try {
      const body = {
        userId: user?.id || user?._id || 'unknown-user',
        email: user?.email || localStorage.getItem('userEmail') || 'user@example.com',
        name: user?.name || user?.displayName || 'User'
      };
      const res = await fetch('/api/payments/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout');
      }
    } catch (err) {
      alert('Network error starting checkout');
    }
  };

  const openBillingPortal = async () => {
    if (!isAuthenticated) {
      loginWithGoogle();
      return;
    }
    try {
      const res = await fetch('/api/payments/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: user?.stripeCustomerId || user?.stripe_customer_id })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Could not open billing portal');
      }
    } catch (e) {
      alert('Network error opening billing portal');
    }
  };

  // Handle action button clicks
  const handleActionClick = (actionId, actionData, message) => {
    switch (actionId) {
      case 'maybe-later': {
        setPaywallDismissed(true);
        try { localStorage.setItem('paywallDismissed', '1'); } catch {}
        setSubscriptionRequired(false);
        break;
      }
      case 'subscribe-now': {
        startCheckout();
        break;
      }
      case 'login': {
        loginWithGoogle();
        break;
      }
      case 'manage-billing': {
        openBillingPortal();
        break;
      }
      case 'retry': {
        // Retry the last user message
        const lastUserMessage = log.filter(msg => msg.from === 'user').pop();
        if (lastUserMessage) {
          setInput(lastUserMessage.text);
        }
        break;
      }
      
      case 'copy-code': {
        // Copy code to clipboard
        if (navigator.clipboard && actionData) {
          navigator.clipboard.writeText(actionData);
          // Show success feedback
          setLog(prev => [...prev, createFormattedMessage(
            '✅ Code copied to clipboard!', 
            MESSAGE_TYPES.SUCCESS
          )]);
        }
        break;
      }
      
      case 'view-details':
        // Toggle detailed view (could expand message)
        console.log('View details for:', message);
        break;
      
      case 'get-help':
        // Set a help message
        setInput('How can I get help with my development question?');
        break;
      
      default:
        console.log('Unknown action:', actionId, actionData);
    }
  };
  const send = async () => {
    if (!input.trim()) return;
  if (subscriptionRequired && !isSubscribed) return;
    
    const userMsg = input.trim();
    // Log the user's message attempt before checking subscription
    setLog(prev => [...prev, { from: 'user', text: userMsg }]);
    
    // Client-side validation
    if (userMsg.length > 2000) {
      const errorMessage = ERROR_TEMPLATES.MESSAGE_TOO_LONG(userMsg.length, 2000);
      setLog(prev => [...prev, { ...errorMessage, from: 'bot' }]);
      return;
    }
    
    setInput('');
    setLog(prev => [...prev, { from: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // Simulate a successful response for demo purposes if message contains "demo"
      if (userMsg.toLowerCase().includes('demo')) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockStructuredResponse = `## Building a React Todo App

Here's a **step-by-step guide** to create your todo application:

### Prerequisites
- Node.js installed on your computer
- Basic knowledge of JavaScript and React

### Step-by-Step Instructions

1. **Set up the project**
   - Create a new React app
   - Install necessary dependencies

2. **Create the main components**
   - TodoList component
   - TodoItem component
   - AddTodo component

3. **Implement state management**
   - Use useState for todo items
   - Handle add, delete, and toggle functions

### Code Example

\`\`\`jsx
import React, { useState } from 'react';

function TodoApp() {
  const [todos, setTodos] = useState([]);
  
  const addTodo = (text) => {
    setTodos([...todos, { id: Date.now(), text, completed: false }]);
  };
  
  return (
    <div className="todo-app">
      <h1>My Todo App</h1>
      {/* Component JSX here */}
    </div>
  );
}
  // Track user message count with gating logic
  setUserMessageCount(count => handleMessageCountAdvance(count));
    if (!isSubscribed && (userMessageCount >= FREE_MESSAGE_LIMIT) && !paywallDismissed) {
      setSubscriptionRequired(true);
      const prompt = getPaywallPrompt();
      const augmented = { ...prompt };
      if (!isAuthenticated) {
        augmented.actions = [
          { id: 'login', label: 'Login to Subscribe', icon: '🔑', variant: 'primary' },
          ...(prompt.actions || [])
        ];
      } else if (isAuthenticated && !isSubscribed) {
        augmented.actions = [
          { id: 'subscribe-now', label: 'Subscribe Now', icon: '💳', variant: 'primary' },
          ...(prompt.actions || [])
        ];
      }
      setLog(prev => [...prev, { ...augmented, from: 'bot' }]);
      return;
    }
\`\`\`

**Next Steps:**
- Add styling with CSS
- Implement local storage
- Add edit functionality

**Tips:**
- Keep components small and focused
- Use meaningful variable names
- Test your app thoroughly`;
        
        const formattedMessage = createFormattedMessage(mockStructuredResponse);
        setLog(prev => [...prev, { 
          ...formattedMessage,
          from: 'bot',
          responseTime: 1000
        }]);
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Handle specific error responses with enhanced templates
        let errorMessage;
        
        if (res.status === 429) {
          const retryAfter = data.retryAfter || data.timeRemaining || '60 seconds';
          errorMessage = ERROR_TEMPLATES.RATE_LIMIT(retryAfter);
        } else if (res.status === 503) {
          errorMessage = ERROR_TEMPLATES.SERVICE_UNAVAILABLE();
        } else if (data.hint && data.hint.includes('content that cannot be processed')) {
          errorMessage = ERROR_TEMPLATES.INVALID_CONTENT();
        } else {
          // Fallback to custom error message
          let errorText = data.error || 'An unexpected error occurred';
          
          if (data.hint) {
            errorText += `\n\n**Suggestion:** ${data.hint}`;
          }
          
          if (data.supportEmail) {
            errorText += `\n\n**Need help?** Contact ${data.supportEmail}`;
            if (data.errorId) {
              errorText += ` (Error ID: \`${data.errorId}\`)`;
            }
          }
          
          errorMessage = createFormattedMessage(errorText, MESSAGE_TYPES.ERROR);
        }
        
        setLog(prev => [...prev, { 
          ...errorMessage,
          from: 'bot',
          isError: true 
        }]);
        return;
      }
      
      // Handle successful response with enhanced formatting
      const botReply = data.reply || "I'm sorry, I couldn't generate a response.";
      const formattedMessage = createFormattedMessage(botReply);
      
      setLog(prev => [...prev, { 
        ...formattedMessage,
        from: 'bot',
        responseTime: data.meta?.responseTime
      }]);
      
    } catch (networkError) {
      console.error('Network error:', networkError);
      const errorMessage = ERROR_TEMPLATES.NETWORK_ERROR();
      setLog(prev => [...prev, { 
        ...errorMessage,
        from: 'bot',
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Helper for gating logic when advancing message count
  const handleMessageCountAdvance = useCallback((count) => {
    const newCount = count + 1;
    if (!isSubscribed && newCount > FREE_MESSAGE_LIMIT && !paywallDismissed) {
      setSubscriptionRequired(true);
      const prompt = getPaywallPrompt();
      const augmented = { ...prompt };
      if (!isAuthenticated) {
        augmented.actions = [
          { id: 'login', label: 'Login to Subscribe', icon: '🔑', variant: 'primary' },
          ...(prompt.actions || [])
        ];
      } else {
        augmented.actions = [
          { id: 'subscribe-now', label: 'Subscribe Now', icon: '💳', variant: 'primary' },
          ...(prompt.actions || [])
        ];
      }
      setLog(prev => [...prev, { ...augmented, from: 'bot' }]);
      return currentCount; // freeze
    }
    return newCount;
  }, []);

  // Helper for gating logic when advancing message count
  const handleMessageCountAdvance = useCallback((count) => {
    return maybeShowPaywall(count, {
      isSubscribed,
      FREE_MESSAGE_LIMIT,
      paywallDismissed,
      isAuthenticated,
      setSubscriptionRequired,
      setLog
    });
  }, [FREE_MESSAGE_LIMIT, isAuthenticated, isSubscribed, paywallDismissed, setSubscriptionRequired, setLog, maybeShowPaywall]);
  const remainingMessages = useMemo(() => {
    if (isSubscribed) return Infinity;
    return Math.max(FREE_MESSAGE_LIMIT - userMessageCount, 0);
  }, [FREE_MESSAGE_LIMIT, isSubscribed, userMessageCount]);

  const usagePercent = useMemo(() => {
    if (isSubscribed) return 100;
    return Math.min(100, (userMessageCount / FREE_MESSAGE_LIMIT) * 100);
  }, [userMessageCount, FREE_MESSAGE_LIMIT, isSubscribed]);

  const exampleQuestions = [
    "Build a todo app with React",
    "Create a landing page for my startup",
    "Help me design a database schema",
    "What's the best way to deploy my app?"
  ];

  return (
    <div className="bot-ui">
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-header-content">
            <div className="bot-avatar">🤖</div>
            <div className="bot-info">
              <h3>AI Development Assistant</h3>
              <p>Ready to help you build amazing things</p>
            </div>
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span>Online</span>
            </div>
          </div>
        </div>

        <div className="chat-messages">
          {/* aria-live region for screen readers */}
          <div ref={liveRegionRef} aria-live="polite" style={{position:'absolute', left:'-9999px', top:'-9999px'}} />
          {log.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.from === 'user' ? 'message-user' : 'message-bot'} ${message.isError ? 'message-error' : ''}`}
            >
              <div className="message-avatar">
                {message.from === 'user' ? '👤' : (message.isError ? '⚠️' : (message.template?.icon || '🤖'))}
              </div>
              <div className="message-content">
                {message.from === 'user' || !message.structure ? (
                  <div className={`message-bubble ${message.isError ? 'error-bubble' : ''}`}>
                    {message.text}
                  </div>
                ) : (
                  <EnhancedMessageBubble 
                    message={message} 
                    onActionClick={handleActionClick}
                  />
                )}
                <div className="message-time">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {message.responseTime && (
                    <span className="response-time"> • {message.responseTime}ms</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message message-bot">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="message-bubble typing-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          {log.length === 1 && (
            <div className="example-questions">
              <p>Try asking:</p>
              <div className="example-grid">
                {exampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="example-question"
                    onClick={() => setInput(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="chat-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={subscriptionRequired && !paywallDismissed ? "Subscribe to continue..." : "Describe your project or ask for help..."}
              disabled={isLoading || (subscriptionRequired && !paywallDismissed)}
              className="message-input"
              rows="1"
            />
            <button 
              onClick={send} 
              className={`send-button ${input.trim() ? 'send-button-active' : ''}`}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              {isLoading ? '⏳' : '🚀'}
            </button>
          </div>
          
          <div className="input-hint">
            {isSubscribed ? 'Pro subscriber – unlimited messages' : (
              subscriptionRequired && !paywallDismissed
                ? 'Upgrade required to continue'
                : `${remainingMessages} free message${remainingMessages === 1 ? '' : 's'} left`
            )} • Press Enter to send • Shift+Enter for new line
            {isSubscribed && (
              <button onClick={openBillingPortal} className="manage-billing-btn" style={{ marginLeft: 8 }}>
                Manage Billing
              </button>
            )}
          </div>
          {!isSubscribed && (
            <div className="usage-bar" style={{marginTop:4, height:6, background:'var(--bg-secondary)', borderRadius:4, overflow:'hidden'}}>
              <div style={{width:`${usagePercent}%`, height:'100%', background: usagePercent > 90 ? '#dc2626' : usagePercent > 60 ? '#f59e0b' : 'var(--primary-color)', transition:'width .3s'}} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}