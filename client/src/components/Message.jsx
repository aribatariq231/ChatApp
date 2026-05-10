import React from 'react';

function Message({ message, isOwn }) {
  const getTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className={`message ${isOwn ? 'message-own' : 'message-other'}`}>
      <div className="message-header">
        <span className="message-name">
          {message.username === 'System' ? '🤖 System' : message.username}
        </span>
        <span className="message-time">{getTime(message.timestamp)}</span>
      </div>
      <div className="message-text">{message.text}</div>
    </div>
  );
}

export default Message;