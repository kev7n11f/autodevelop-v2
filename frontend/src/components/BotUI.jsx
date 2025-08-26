import React from 'react';
import './BotUI.css';

export default function BotUI() {
  return (
    <div className="bot-ui">
      <div className="chat-container">
        <div className="chat-header">
          <h2>🤖 AI Development Assistant</h2>
          <p>Welcome to AutoDevelop.ai - Your AI-powered development companion</p>
        </div>
        <div className="chat-messages">
          <div className="message bot-message">
            <div className="message-content">
              <p>Hello! I'm your AI development assistant. I'm here to help you build amazing projects step by step.</p>
              <p>How can I help you today?</p>
            </div>
          </div>
        </div>
        <div className="chat-input-container">
          <div className="chat-input">
            <input 
              type="text" 
              placeholder="Type your message here..." 
              disabled
            />
            <button disabled>Send</button>
          </div>
          <p className="input-note">Chat functionality coming soon! 🚀</p>
        </div>
      </div>
    </div>
  );
}
