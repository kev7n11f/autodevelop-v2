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
    
    const userMsg = input;
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
      setLog(prev => [...prev, { from: 'bot', text: data.reply }]);
    } catch {
      setLog(prev => [...prev, { 
        from: 'bot', 
        text: 'Sorry, I encountered an error. Please try again later.' 
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
              className={`message ${message.from === 'user' ? 'message-user' : 'message-bot'}`}
            >
              <div className="message-avatar">
                {message.from === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  {message.text}
                </div>
                <div className="message-time">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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