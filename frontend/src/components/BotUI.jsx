import React, { useState } from 'react';
import './BotUI.css';
import SEO, { composeTitle } from './SEO';

export default function BotUI() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your AI development assistant. I'm here to help you build amazing projects step by step.\n\nHow can I help you today?"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: message
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
        body: JSON.stringify({ message: message.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        content: data.response || "I'm sorry, I'm having trouble responding right now. Please try again later."
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
                  <p key={index}>{line}</p>
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
