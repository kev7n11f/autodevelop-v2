/**
 * Message formatting utilities for enhanced chat display
 */

// Message template types
export const MESSAGE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  NORMAL: 'normal'
};

// Message templates with emojis and structured formatting
export const MESSAGE_TEMPLATES = {
  [MESSAGE_TYPES.SUCCESS]: {
    icon: '✅',
    prefix: 'Success:',
    className: 'message-success'
  },
  [MESSAGE_TYPES.ERROR]: {
    icon: '❌',
    prefix: 'Error:',
    className: 'message-error'
  },
  [MESSAGE_TYPES.WARNING]: {
    icon: '⚠️',
    prefix: 'Warning:',
    className: 'message-warning'
  },
  [MESSAGE_TYPES.INFO]: {
    icon: 'ℹ️',
    prefix: 'Info:',
    className: 'message-info'
  },
  [MESSAGE_TYPES.NORMAL]: {
    icon: '🤖',
    prefix: '',
    className: 'message-normal'
  }
};

/**
 * Parse markdown-like syntax in messages
 * @param {string} text - The message text to parse
 * @returns {Object} Parsed message structure
 */
export function parseMessageStructure(text) {
  if (!text || typeof text !== 'string') {
    return { content: text || '', hasStructure: false };
  }

  const lines = text.split('\n');
  const parsed = [];
  let hasStructure = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      parsed.push({ type: 'break' });
      continue;
    }

    // Headers (## Header or ### Header)
    if (line.match(/^#{2,3}\s+/)) {
      const level = line.match(/^#{2,3}/)[0].length;
      const content = line.replace(/^#{2,3}\s+/, '');
      parsed.push({ 
        type: 'header', 
        level: level - 1, // Convert to h2, h3
        content: content.trim()
      });
      hasStructure = true;
      continue;
    }

    // Numbered lists (1. Item)
    if (line.match(/^\d+\.\s+/)) {
      const content = line.replace(/^\d+\.\s+/, '');
      parsed.push({ 
        type: 'numbered-item', 
        content: content.trim()
      });
      hasStructure = true;
      continue;
    }

    // Bullet points (- Item or * Item)
    if (line.match(/^[-*]\s+/)) {
      const content = line.replace(/^[-*]\s+/, '');
      parsed.push({ 
        type: 'bullet-item', 
        content: content.trim()
      });
      hasStructure = true;
      continue;
    }

    // Code blocks (```code```)
    if (line.startsWith('```')) {
      const codeLines = [];
      i++; // Skip opening ```
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      parsed.push({ 
        type: 'code-block', 
        content: codeLines.join('\n')
      });
      hasStructure = true;
      continue;
    }

    // Inline code (`code`)
    if (line.includes('`') && !line.startsWith('```')) {
      const processedLine = line.replace(/`([^`]+)`/g, '<code>$1</code>');
      parsed.push({ 
        type: 'text', 
        content: processedLine
      });
      if (processedLine !== line) hasStructure = true;
      continue;
    }

    // Bold text (**text**)
    if (line.includes('**')) {
      const processedLine = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      parsed.push({ 
        type: 'text', 
        content: processedLine
      });
      if (processedLine !== line) hasStructure = true;
      continue;
    }

    // Regular text
    parsed.push({ 
      type: 'text', 
      content: line
    });
  }

  return { content: parsed, hasStructure };
}

/**
 * Detect message type based on content
 * @param {string} text - The message text
 * @returns {string} Message type
 */
export function detectMessageType(text) {
  if (!text) return MESSAGE_TYPES.NORMAL;
  
  const lowerText = text.toLowerCase();
  
  // Success indicators
  if (lowerText.includes('success') || lowerText.includes('completed') || 
      lowerText.includes('done') || lowerText.includes('finished')) {
    return MESSAGE_TYPES.SUCCESS;
  }
  
  // Error indicators
  if (lowerText.includes('error') || lowerText.includes('failed') || 
      lowerText.includes('problem') || lowerText.includes('issue')) {
    return MESSAGE_TYPES.ERROR;
  }
  
  // Warning indicators
  if (lowerText.includes('warning') || lowerText.includes('caution') || 
      lowerText.includes('be careful') || lowerText.includes('note that')) {
    return MESSAGE_TYPES.WARNING;
  }
  
  // Info indicators
  if (lowerText.includes('tip:') || lowerText.includes('note:') || 
      lowerText.includes('remember') || lowerText.includes('important:')) {
    return MESSAGE_TYPES.INFO;
  }
  
  return MESSAGE_TYPES.NORMAL;
}

/**
 * Create a formatted message object
 * @param {string} text - The message text
 * @param {string} type - Optional explicit message type
 * @param {Object} actions - Optional action buttons
 * @returns {Object} Formatted message object
 */
export function createFormattedMessage(text, type = null, actions = null) {
  const messageType = type || detectMessageType(text);
  const structure = parseMessageStructure(text);
  const template = MESSAGE_TEMPLATES[messageType];
  
  return {
    text,
    type: messageType,
    template,
    structure,
    actions: actions || null,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create common action buttons for messages
 */
export const COMMON_ACTIONS = {
  RETRY: {
    id: 'retry',
    label: 'Try Again',
    icon: '🔄',
    variant: 'primary'
  },
  VIEW_DETAILS: {
    id: 'view-details',
    label: 'View Details',
    icon: '📋',
    variant: 'secondary'
  },
  COPY_CODE: {
    id: 'copy-code',
    label: 'Copy Code',
    icon: '📋',
    variant: 'secondary'
  },
  GET_HELP: {
    id: 'get-help',
    label: 'Get Help',
    icon: '❓',
    variant: 'secondary'
  }
};

/**
 * Error message templates with actions
 */
export const ERROR_TEMPLATES = {
  RATE_LIMIT: (retryAfter) => createFormattedMessage(
    `## Rate Limit Exceeded\n\nToo many requests. Please wait ${retryAfter || '60 seconds'} before trying again.\n\n**Tip:** Try breaking complex questions into smaller parts.`,
    MESSAGE_TYPES.ERROR,
    [COMMON_ACTIONS.RETRY]
  ),
  
  NETWORK_ERROR: () => createFormattedMessage(
    `## Connection Error\n\nUnable to connect to the server. Please check your internet connection.\n\n**What you can try:**\n- Check your internet connection\n- Refresh the page\n- Try again in a few moments`,
    MESSAGE_TYPES.ERROR,
    [COMMON_ACTIONS.RETRY]
  ),
  
  SERVICE_UNAVAILABLE: () => createFormattedMessage(
    `## Service Temporarily Unavailable\n\nOur AI service is currently experiencing high demand.\n\n**Please try:**\n- Waiting a few minutes\n- Simplifying your question\n- Breaking complex requests into smaller parts`,
    MESSAGE_TYPES.ERROR,
    [COMMON_ACTIONS.RETRY, COMMON_ACTIONS.GET_HELP]
  ),
  
  MESSAGE_TOO_LONG: (currentLength, maxLength) => createFormattedMessage(
    `## Message Too Long\n\nYour message is **${currentLength} characters** long, but the limit is **${maxLength} characters**.\n\n**Please:**\n- Shorten your message\n- Break it into multiple questions\n- Focus on the most important parts`,
    MESSAGE_TYPES.ERROR
  ),
  
  INVALID_CONTENT: () => createFormattedMessage(
    `## Content Cannot Be Processed\n\nYour message contains content that cannot be processed.\n\n**Please:**\n- Rephrase your question\n- Focus on development topics\n- Avoid inappropriate content`,
    MESSAGE_TYPES.WARNING
  )
};

/**
 * Success message templates
 */
export const SUCCESS_TEMPLATES = {
  OPERATION_COMPLETE: (operation) => createFormattedMessage(
    `## ${operation} Completed Successfully\n\nYour request has been processed successfully.`,
    MESSAGE_TYPES.SUCCESS
  ),
  
  CODE_GENERATED: () => createFormattedMessage(
    `## Code Generated Successfully\n\nI've created the code for you. You can copy it using the button below.`,
    MESSAGE_TYPES.SUCCESS,
    [COMMON_ACTIONS.COPY_CODE]
  )
};