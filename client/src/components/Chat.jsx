import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Picker from 'emoji-picker-react';

function Chat({ username, room, onLogout, onRoomChange }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [typingUser, setTypingUser] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showRoomMenu, setShowRoomMenu] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  
  // Popular rooms list
  const popularRooms = ['1', '2', '3', '4', '5', 'General', 'Gaming', 'Music'];
  
  useEffect(() => {
    // Connect to server
    socketRef.current = io('http://localhost:5001');
    
    // Load previous messages
    loadMessages();
    
    // Join the room
    socketRef.current.emit('join-room', { username, room });
    
    // Listen for previous messages
    socketRef.current.on('previous-messages', (oldMessages) => {
      setMessages(oldMessages || []);
    });
    
    // Listen for new messages
    socketRef.current.on('receive-message', (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    // Listen for system messages
    socketRef.current.on('system-message', (message) => {
      setMessages(prev => [...prev, { ...message, username: 'System' }]);
    });
    
    // Listen for room users
    socketRef.current.on('room-users', (data) => {
      if (data && data.users) {
        setOnlineUsers(data.users);
        setMemberCount(data.count);
      } else if (Array.isArray(data)) {
        setOnlineUsers(data);
        setMemberCount(data.length);
      } else {
        setOnlineUsers([]);
        setMemberCount(0);
      }
    });
    
    // Listen for typing
    socketRef.current.on('user-typing', (user) => {
      setTypingUser(user);
      setTimeout(() => {
        setTypingUser(null);
      }, 1000);
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [username, room]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const loadMessages = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/messages/${room}`);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };
  
  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    socketRef.current.emit('send-message', {
      username,
      text: newMessage.trim(),
      room
    });
    setNewMessage('');
    setShowEmojiPicker(false);
  };
  
  const handleTyping = () => {
    socketRef.current.emit('typing', { username, room });
  };
  
  const onEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };
  
  const handleRoomSwitch = () => {
    if (newRoomNumber.trim() && newRoomNumber !== room) {
      // Emit leave event for current room
      socketRef.current.emit('leave-room', { username, room });
      // Change room
      onRoomChange(newRoomNumber.trim());
      setShowRoomMenu(false);
      setNewRoomNumber('');
    }
  };
  
  const quickEmojis = ['😊', '😂', '❤️', '👍', '🎉', '😢', '😡', '🥳', '🤔', '👋'];
  
  const addQuickEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
  };
  
  return (
    <div className="chat-container">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="header-left">
          <h2>💬 Room {room}</h2>
          <div className="member-badge">
            👥 {memberCount}
          </div>
        </div>
        <div className="header-right">
          <button className="room-switch-btn" onClick={() => setShowRoomMenu(!showRoomMenu)}>
            🔄 Switch Room
          </button>
          <button className="logout-btn-mobile" onClick={onLogout}>
            🚪
          </button>
        </div>
      </div>
      
      {/* Room Switcher Menu */}
      {showRoomMenu && (
        <div className="room-menu-overlay">
          <div className="room-menu">
            <div className="room-menu-header">
              <h3>Switch Room</h3>
              <button onClick={() => setShowRoomMenu(false)}>✕</button>
            </div>
            <div className="room-menu-body">
              <div className="current-room">
                Current: <strong>Room {room}</strong>
              </div>
              <input
                type="text"
                placeholder="Enter room number"
                value={newRoomNumber}
                onChange={(e) => setNewRoomNumber(e.target.value)}
                autoFocus
              />
              <button onClick={handleRoomSwitch} className="switch-btn">
                Switch to Room {newRoomNumber}
              </button>
              <div className="popular-rooms">
                <p>Popular Rooms:</p>
                <div className="popular-rooms-list">
                  {popularRooms.map(r => (
                    <button 
                      key={r} 
                      className="popular-room-btn"
                      onClick={() => {
                        setNewRoomNumber(r);
                        setTimeout(handleRoomSwitch, 100);
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Desktop Header (shows on larger screens) */}
      <div className="desktop-header">
        <div className="header-left">
          <h2>💬 Room: {room}</h2>
          <div className="room-info">
            <span className="room-badge">🏠 Room {room}</span>
            <span className="member-count-badge">👥 {memberCount} member{memberCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="header-right">
          <button className="room-switch-btn-desktop" onClick={() => setShowRoomMenu(!showRoomMenu)}>
            🔄 Switch Room
          </button>
          <span className="username">👤 {username}</span>
          <span className="online-count">🟢 {memberCount} online</span>
          <button onClick={onLogout} className="logout-btn">🚪 Leave Room</button>
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="chat-area">
        {/* Online Users Sidebar - Hidden on mobile, shows in sidebar */}
        <div className="sidebar">
          <h3>📋 Members ({memberCount})</h3>
          <div className="users-list">
            {onlineUsers && onlineUsers.length > 0 ? (
              onlineUsers.map((user, index) => (
                <div key={index} className={`user ${user === username ? 'current-user' : ''}`}>
                  <span>{user === username ? '👤 ' : '👤 '}{user} {user === username && '(You)'}</span>
                </div>
              ))
            ) : (
              <div className="no-users">No other users</div>
            )}
          </div>
        </div>
        
        {/* Messages Area */}
        <div className="messages-container">
          <div className="messages-list">
            {messages && messages.length > 0 ? (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`message ${msg.username === username ? 'message-own' : 'message-other'} ${msg.username === 'System' ? 'system-message' : ''}`}
                >
                  <div className="message-header">
                    <span className="message-name">
                      {msg.username === 'System' ? '🤖 System' : msg.username}
                    </span>
                    <span className="message-time">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="message-text">{msg.text}</div>
                </div>
              ))
            ) : (
              <div className="no-messages">
                <p>💬 No messages yet</p>
                <p>Be the first to send a message!</p>
              </div>
            )}
            {typingUser && typingUser !== username && (
              <div className="typing-indicator">
                <span>{typingUser} is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message Input with Emoji Icon */}
          <div className="input-container">
            {/* Quick Emojis Row - Hidden on mobile */}
            <div className="quick-emojis desktop-only">
              {quickEmojis.map((emoji, index) => (
                <button 
                  key={index} 
                  className="quick-emoji-btn"
                  onClick={() => addQuickEmoji(emoji)}
                  type="button"
                >
                  {emoji}
                </button>
              ))}
            </div>
            
            <form onSubmit={sendMessage} className="input-form">
              {/* Emoji Icon Button */}
              <button 
                type="button"
                className="emoji-icon-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                😊
              </button>
              
              <input
                type="text"
                placeholder={`Message in room ${room}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyUp={handleTyping}
                maxLength="200"
              />
              <button type="submit" className="send-btn">📤</button>
            </form>
            
            {/* Emoji Picker Popup */}
            {showEmojiPicker && (
              <div className="emoji-picker-container">
                <Picker onEmojiClick={onEmojiClick} />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom Nav */}
      <div className="mobile-bottom-nav">
        <button className="nav-btn" onClick={() => setShowRoomMenu(true)}>
          🔄 Switch Room
        </button>
        <button className="nav-btn" onClick={onLogout}>
          🚪 Leave
        </button>
      </div>
    </div>
  );
}

export default Chat;