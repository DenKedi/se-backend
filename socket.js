const jwt = require('jsonwebtoken');
const { getChat, pushMessageToChat } = require('./utils/chatService');
const errorHandler = require('./middleware/errorHandler');
const auth = require('./middleware/auth');

module.exports = io => {
  io.use((socket, next) => auth(socket, next));

  io.on('connection', socket => {
    console.log(`User connected: ${socket.id}, User ID: ${socket.user._id}`);

    socket.on('joinRoom', async ({ chatId }) => {
      try {
        socket.join(chatId);
        console.log(`User ${socket.user._id} joined room: ${chatId}`);

        const chatData = await getChat(chatId, socket.user._id);
        socket.emit('chatData', chatData);
      } catch (err) {
        errorHandler(err, { socket });
      }
    });

    socket.on('sendMessage', async (messagePayload) => {
      try {
        const { chatId, text, isEncrypted, encryptedContent, iv, encryptedKeys } = messagePayload;

        // Prepare message data based on encryption status
        const messageData = isEncrypted
          ? { isEncrypted: true, encryptedContent, iv, encryptedKeys }
          : { text };

        console.log(`📨 New message from ${socket.user._id} to chat ${chatId}`);
        console.log(`   Encrypted: ${isEncrypted || false}`);
        if (isEncrypted) {
          console.log(`   Recipients with encrypted keys: ${encryptedKeys?.length || 0}`);
        }

        const chatData = await pushMessageToChat(chatId, socket.user._id, messageData);

        const newMessage = chatData.messages[chatData.messages.length - 1];
        console.log(`✅ Message saved. isEncrypted in DB: ${newMessage.isEncrypted}`);
        
        io.to(chatId).emit('newMessage', { message: newMessage, chatId });
      } catch (err) {
        console.error('❌ Error in sendMessage:', err);
        errorHandler(err, { socket });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
