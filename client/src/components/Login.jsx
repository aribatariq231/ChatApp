import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    if (!room.trim()) {
      setError('Please enter a room number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5001/api/login', {
        username: username.trim(),
        room: room.trim()
      });
      
      if (response.data.success) {
        onLogin(username.trim(), room.trim());
      }
    } catch (err) {
      setError('Server error. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo">
          <span className="logo-icon">💬</span>
          <h1>ChatRoom</h1>
        </div>
        <p className="subtitle">😊 Join a room and start chatting!</p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <span className="input-icon">👤</span>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength="20"
              required
            />
          </div>
          
          <div className="input-group">
            <span className="input-icon">🏠</span>
            <input
              type="text"
              placeholder="Room Number"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              maxLength="10"
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Joining...' : '🎉 Join Room'}
          </button>
          
          {error && <p className="error">{error}</p>}
        </form>
        
        <div className="features-list">
          <span>✨ Features: Emojis</span>
          <span>👥 Members Count</span>
          <span>🔄 Switch Rooms</span>
        </div>
      </div>
    </div>
  );
}

export default Login;