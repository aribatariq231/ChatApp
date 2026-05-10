import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Chat from './components/Chat';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  
  useEffect(() => {
    const savedUser = localStorage.getItem('chatUser');
    const savedRoom = localStorage.getItem('chatRoom');
    if (savedUser && savedRoom) {
      setUser(savedUser);
      setRoom(savedRoom);
    }
  }, []);
  
  const handleLogin = (username, room) => {
    setUser(username);
    setRoom(room);
    localStorage.setItem('chatUser', username);
    localStorage.setItem('chatRoom', room);
  };
  
  const handleLogout = () => {
    setUser(null);
    setRoom(null);
    localStorage.removeItem('chatUser');
    localStorage.removeItem('chatRoom');
  };
  
  const handleRoomChange = (newRoom) => {
    setRoom(newRoom);
    localStorage.setItem('chatRoom', newRoom);
  };
  
  return (
    <div className="App">
      {!user || !room ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Chat 
          username={user} 
          room={room} 
          onLogout={handleLogout}
          onRoomChange={handleRoomChange}
        />
      )}
    </div>
  );
}

export default App;