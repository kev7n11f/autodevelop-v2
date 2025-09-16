import React from 'react';
import BotUI from './BotUI';
import SEO, { composeTitle } from './SEO';

export default function Chat() {
  return (
    <div className="page-container">
      <SEO 
        title={composeTitle('AI Chat Assistant')} 
        description="Chat with AutoDevelop.ai's AI assistant for development guidance, code help, and project support." 
        pathname="/chat" 
      />
      <BotUI />
    </div>
  );
}