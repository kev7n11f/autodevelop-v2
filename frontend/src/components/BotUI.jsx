import React, { useState } from 'react';
import './BotUI.css';
import SEO, { composeTitle } from './SEO';

export default function BotUI() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "👋 Hello! I'm your AI software development assistant! I'm absolutely thrilled to help you build amazing applications, websites, and digital projects.\n\n✨ Whether you're just starting your coding journey or you're an experienced developer, I'm here to guide you step-by-step through:\n• Web development & app building\n• Programming languages & frameworks\n• Database design & APIs\n• Deployment & best practices\n• Code reviews & optimization\n\n🚀 What exciting project would you like to work on today? I can't wait to help you bring your ideas to life!"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Load suggestions when component mounts
  React.useEffect(() => {
    fetch('/api/chat/suggestions')
      .then(response => response.json())
      .then(data => setSuggestions(data.suggestions))
      .catch(error => console.error('Failed to load suggestions:', error));
  }, []);

  const handleSendMessage = async (messageText = null) => {
    const textToSend = messageText || message.trim();
    if (!textToSend) return;

    // Hide suggestions after first message
    setShowSuggestions(false);

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: textToSend
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: textToSend }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        content: data.reply || "I'm sorry, I'm having trouble responding right now. Please try again later."
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse = {
        id: messages.length + 2,
        type: 'bot',
        content: "I'm experiencing some technical difficulties. Please check that the OpenAI API is configured and try again."
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  return (
    <div className="bot-ui">
      <SEO title={composeTitle('Chat')} description="AI Development Assistant — get guidance, code examples and step-by-step help." pathname="/" />
      <div className="chat-container">
        <div className="chat-header">
          <h2>🤖 AI Development Assistant</h2>
          <p>Welcome to AutoDevelop.ai - Your AI-powered development companion</p>
        </div>
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.type}-message`}>
              <div className="message-content">
                {msg.content.split('\n').map((line, index) => (
                  <p key={`${msg.id}-${index}`}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message bot-message">
              <div className="message-content">
                <p>🤔 Thinking...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Suggested Questions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-container">
            <h3>💡 Suggested Questions</h3>
            <div className="suggestions-grid">
              {suggestions.map((category) => (
                <div key={category.id} className="suggestion-category">
                  <h4>{category.category}</h4>
                  <div className="suggestion-questions">
                    {category.questions.slice(0, 2).map((question, index) => (
                      <button
                        key={index}
                        className="suggestion-button"
                        onClick={() => handleSuggestionClick(question)}
                        disabled={isLoading}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="chat-input-container">
          <div className="chat-input">
            <input 
              type="text" 
              placeholder="Type your message here..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim()}
            >
              Send
            </button>
          </div>
          <p className="input-note">
            {isLoading ? 'Processing your request...' : 'Press Enter to send or Shift+Enter for new line'}
          </p>
        </div>
      </div>
    </div>
  );
}
