import { useState, useRef, useEffect } from 'react';
import './BotUI.css';

export default function BotUI() {
  const [input, setInput] = useState('');
  const [log, setLog] = useState([
    { from: 'bot', text: 'Hello! I\'m your AI development assistant. How can I help you bring your ideas to life today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [log]);

  const send = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    
    // Client-side validation
    if (userMsg.length > 2000) {
      setLog(prev => [...prev, { 
        from: 'bot', 
        text: `Your message is too long (${userMsg.length} characters). Please keep it under 2000 characters.`,
        isError: true
      }]);
      return;
    }
    
    setInput('');
    setLog(prev => [...prev, { from: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Handle specific error responses
        let errorMessage = data.error || 'An unexpected error occurred';
        
        if (res.status === 429) {
          const retryAfter = data.retryAfter || data.timeRemaining;
          errorMessage = `${errorMessage}${retryAfter ? ` Please wait ${retryAfter} and try again.` : ''}`;
        } else if (data.hint) {
          errorMessage += ` ${data.hint}`;
        }
        
        if (data.supportEmail) {
          errorMessage += ` If this continues, please contact ${data.supportEmail}`;
          if (data.errorId) {
            errorMessage += ` (Error ID: ${data.errorId})`;
          }
        }
        
        setLog(prev => [...prev, { 
          from: 'bot', 
          text: errorMessage,
          isError: true 
        }]);
        return;
      }
      
      // Handle successful response
      const botReply = data.reply || "I'm sorry, I couldn't generate a response.";
      setLog(prev => [...prev, { 
        from: 'bot', 
        text: botReply,
        responseTime: data.meta?.responseTime
      }]);
      
    } catch (networkError) {
      console.error('Network error:', networkError);
      setLog(prev => [...prev, { 
        from: 'bot', 
        text: 'Unable to connect to the server. Please check your internet connection and try again.',
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
          {log.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.from === 'user' ? 'message-user' : 'message-bot'} ${message.isError ? 'message-error' : ''}`}
            >
              <div className="message-avatar">
                {message.from === 'user' ? '👤' : (message.isError ? '⚠️' : '🤖')}
              </div>
              <div className="message-content">
                <div className={`message-bubble ${message.isError ? 'error-bubble' : ''}`}>
                  {message.text}
                </div>
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
              placeholder="Describe your project or ask for help..."
              className="message-input"
              rows="1"
              disabled={isLoading}
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
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}