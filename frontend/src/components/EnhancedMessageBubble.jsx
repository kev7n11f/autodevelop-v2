import React, { useState } from 'react';
import { MESSAGE_TYPES } from '../utils/messageFormatter';

/**
 * Component for rendering structured message content
 */
const StructuredMessage = ({ structure, onActionClick }) => {
  const [expandedSections, setExpandedSections] = useState(new Set());

  const toggleSection = (index) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const renderContent = (item, index) => {
    switch (item.type) {
      case 'header': {
        const HeaderTag = `h${item.level + 2}`; // h2, h3, h4
        return (
          <HeaderTag key={index} className={`message-header message-header-${item.level}`}>
            {item.content}
          </HeaderTag>
        );
      }

      case 'numbered-item':
        return (
          <div key={index} className="message-numbered-item">
            <span className="item-number">•</span>
            <span className="item-content" dangerouslySetInnerHTML={{ __html: item.content }} />
          </div>
        );

      case 'bullet-item':
        return (
          <div key={index} className="message-bullet-item">
            <span className="bullet-point">•</span>
            <span className="item-content" dangerouslySetInnerHTML={{ __html: item.content }} />
          </div>
        );

      case 'code-block':
        return (
          <div key={index} className="message-code-block">
            <div className="code-header">
              <span className="code-label">Code</span>
              <button 
                className="code-copy-btn"
                onClick={() => onActionClick && onActionClick('copy-code', item.content)}
                title="Copy code"
              >
                📋
              </button>
            </div>
            <pre className="code-content">
              <code>{item.content}</code>
            </pre>
          </div>
        );

      case 'text':
        return (
          <p key={index} className="message-text" dangerouslySetInnerHTML={{ __html: item.content }} />
        );

      case 'break':
        return <br key={index} />;

      case 'collapsible': {
        const isExpanded = expandedSections.has(index);
        return (
          <div key={index} className="message-collapsible">
            <button 
              className="collapsible-toggle"
              onClick={() => toggleSection(index)}
            >
              <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>
              {item.title}
            </button>
            {isExpanded && (
              <div className="collapsible-content">
                {item.content.map((subItem, subIndex) => renderContent(subItem, `${index}-${subIndex}`))}
              </div>
            )}
          </div>
        );
      }

      default:
        return <span key={index}>{item.content}</span>;
    }
  };

  if (!structure || !structure.content) {
    return null;
  }

  // If it's just a string, render as simple text
  if (typeof structure.content === 'string') {
    return <div className="message-simple-text">{structure.content}</div>;
  }

  // Render structured content
  return (
    <div className="message-structured-content">
      {structure.content.map((item, index) => renderContent(item, index))}
    </div>
  );
};

/**
 * Component for rendering action buttons
 */
const MessageActions = ({ actions, onActionClick }) => {
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className="message-actions">
      {actions.map((action, index) => (
        <button
          key={action.id || index}
          className={`action-button action-${action.variant || 'secondary'}`}
          onClick={() => onActionClick && onActionClick(action.id, action)}
          title={action.label}
        >
          {action.icon && <span className="action-icon">{action.icon}</span>}
          <span className="action-label">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

/**
 * Enhanced message bubble component with structured content support
 */
const EnhancedMessageBubble = ({ message, onActionClick }) => {
  const { text, template, structure, actions, isError, type } = message;

  // Only show type header for non-normal types with a non-empty prefix
  const showTypeHeader = [
    'error', 'warning', 'info', 'success'
  ].includes(type) && template && template.prefix;

  // Determine message class
  const messageClass = isError ? 'error-bubble' :
    (template && type !== 'normal' ? template.className : 'message-normal');

  // Handle action clicks
  const handleActionClick = (actionId, actionData) => {
    if (onActionClick) {
      onActionClick(actionId, actionData, message);
    }
  };

  return (
    <div className={`message-bubble enhanced-bubble ${messageClass}`}>
      {/* Message type indicator (only for non-normal types with prefix) */}
      {showTypeHeader && (
        <div className="message-type-header">
          <span className="message-type-icon">{template.icon}</span>
          <span className="message-type-label">{template.prefix}</span>
        </div>
      )}

      {/* Message content */}
      <div className="message-main-content">
        {structure && structure.hasStructure ? (
          <StructuredMessage 
            structure={structure} 
            onActionClick={handleActionClick} 
          />
        ) : (
          <div className="message-simple-text">{text}</div>
        )}
      </div>

      {/* Action buttons (for any message with actions) */}
      {actions && actions.length > 0 && (
        <MessageActions 
          actions={actions} 
          onActionClick={handleActionClick} 
        />
      )}
    </div>
  );
};

export default EnhancedMessageBubble;
export { StructuredMessage, MessageActions };