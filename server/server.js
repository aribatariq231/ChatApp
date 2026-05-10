// // Dotenv config
// require('dotenv').config();

// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const http = require('http');
// const socketIo = require('socket.io');

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"]
//   }
// });

// app.use(cors());
// app.use(express.json());

// // Take URL from .env
// const MONGODB_URI = process.env.MONGODB_URI;

// console.log('MONGODB_URI from .env:', MONGODB_URI ? '✅ Found' : '❌ Not found');

// if (!MONGODB_URI) {
//   console.error('❌ MONGODB_URI not found in .env file');
//   console.log('💡 Make sure .env file has: MONGODB_URI=your_url_here');
//   process.exit(1);
// }

// console.log('📡 Connecting to MongoDB Atlas...');

// // Connect to MongoDB
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     console.log('✅ Connected to MongoDB Atlas successfully!');
//     console.log('🎉 Chat database is ready!\n');
//   })
//   .catch((err) => {
//     console.error('❌ MongoDB Connection Error:', err.message);
//     console.log('\n💡 Fixes:');
//     console.log('1. Check password in .env file');
//     console.log('2. Go to MongoDB Atlas -> Network Access -> Add IP 0.0.0.0/0');
//     console.log('3. Check username/password is correct\n');
//   });

// // Simple Schemas
// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true }
// });
// const messageSchema = new mongoose.Schema({
//   username: String,
//   text: String,
//   timestamp: { type: Date, default: Date.now }
// });

// const User = mongoose.model('User', userSchema);
// const Message = mongoose.model('Message', messageSchema);

// // API Routes
// app.post('/api/login', async (req, res) => {
//   try {
//     const { username } = req.body;
//     let user = await User.findOne({ username });
//     if (!user) {
//       user = await User.create({ username });
//       console.log(`✅ New user: ${username}`);
//     }
//     res.json({ success: true, username });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// app.get('/api/messages', async (req, res) => {
//   try {
//     const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
//     res.json(messages.reverse());
//   } catch (error) {
//     res.json([]);
//   }
// });

// // Socket.IO
// io.on('connection', (socket) => {
//   console.log('🔌 Client connected');
  
//   socket.on('user-joined', (username) => {
//     socket.username = username;
//     console.log(`👤 ${username} joined`);
//     socket.broadcast.emit('user-joined', username);
//   });
  
//   socket.on('send-message', async (data) => {
//     try {
//       const message = await Message.create(data);
//       io.emit('receive-message', {
//         username: data.username,
//         text: data.text,
//         timestamp: message.timestamp
//       });
//     } catch (error) {
//       console.error('Error:', error);
//     }
//   });
  
//   socket.on('disconnect', () => {
//     if (socket.username) {
//       console.log(`👋 ${socket.username} left`);
//       io.emit('user-left', socket.username);
//     }
//   });
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`\n🚀 Server: http://localhost:${PORT}`);
//   console.log(`✅ Ready to accept connections\n`);
// });






require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:3000" }
});

app.use(cors());
app.use(express.json());

// Store messages for each room
const roomMessages = {};
const roomUsers = {};

console.log('✅ Chat server with Rooms feature started!');

// API Routes
app.post('/api/login', (req, res) => {
  const { username, room } = req.body;
  console.log(`📝 User: ${username} joined room: ${room}`);
  res.json({ success: true, username, room });
});

app.get('/api/messages/:room', (req, res) => {
  const { room } = req.params;
  const messages = roomMessages[room] || [];
  res.json(messages.slice(-50));
});

// Socket.IO with Rooms
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  socket.on('join-room', ({ username, room }) => {
    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
      
      if (roomUsers[socket.currentRoom]) {
        roomUsers[socket.currentRoom] = roomUsers[socket.currentRoom].filter(u => u !== username);
        io.to(socket.currentRoom).emit('room-users', {
          users: roomUsers[socket.currentRoom],
          count: roomUsers[socket.currentRoom].length
        });
        io.to(socket.currentRoom).emit('system-message', {
          text: `${username} left the room`,
          timestamp: new Date()
        });
      }
    }
    
    socket.username = username;
    socket.currentRoom = room;
    socket.join(room);
    
    if (!roomMessages[room]) {
      roomMessages[room] = [];
    }
    if (!roomUsers[room]) {
      roomUsers[room] = [];
    }
    
    if (!roomUsers[room].includes(username)) {
      roomUsers[room].push(username);
    }
    
    console.log(`👤 ${username} joined room: ${room}`);
    console.log(`📊 Room ${room} now has ${roomUsers[room].length} members`);
    
    socket.emit('previous-messages', roomMessages[room].slice(-50));
    socket.emit('room-users', {
      users: roomUsers[room],
      count: roomUsers[room].length
    });
    
    io.to(room).emit('room-users', {
      users: roomUsers[room],
      count: roomUsers[room].length
    });
    
    socket.broadcast.to(room).emit('system-message', {
      text: `${username} joined the room`,
      timestamp: new Date()
    });
  });
  
  socket.on('send-message', ({ username, text, room }) => {
    const message = {
      username,
      text,
      timestamp: new Date(),
      room
    };
    
    if (!roomMessages[room]) {
      roomMessages[room] = [];
    }
    roomMessages[room].push(message);
    
    if (roomMessages[room].length > 100) {
      roomMessages[room] = roomMessages[room].slice(-100);
    }
    
    io.to(room).emit('receive-message', message);
    console.log(`💬 [Room ${room}] ${username}: ${text}`);
  });
  
  socket.on('typing', ({ username, room }) => {
    socket.broadcast.to(room).emit('user-typing', username);
  });
  
  socket.on('disconnect', () => {
    if (socket.username && socket.currentRoom) {
      const room = socket.currentRoom;
      const username = socket.username;
      
      if (roomUsers[room]) {
        roomUsers[room] = roomUsers[room].filter(u => u !== username);
        io.to(room).emit('room-users', {
          users: roomUsers[room],
          count: roomUsers[room].length
        });
        io.to(room).emit('system-message', {
          text: `${username} left the room`,
          timestamp: new Date()
        });
      }
      
      console.log(`👋 ${username} left room: ${room}`);
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`\n🚀 Server: http://localhost:${PORT}`);
  console.log(`✅ Chat server with Rooms feature is ready!\n`);
});