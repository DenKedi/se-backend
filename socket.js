const Chat = require('./models/Chat');
const auth = require('./middleware/auth');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    
    socket.on('joinRoom', (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.id} joined room: ${chatId}`);
    });

    
    socket.on('sendMessage', async ({ chatId, senderId, text }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return console.error('Chat not found.');

        // save message
        const message = { sender: senderId, text };
        chat.messages.push(message);
        await chat.save();

        // Broadcast message to the room
        io.to(chatId).emit('newMessage', message);
      } catch (err) {
        console.error('Error sending message:', err);
      }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  io.use(auth);
};
