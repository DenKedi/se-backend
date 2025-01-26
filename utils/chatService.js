const Chat = require('../models/Chat');
const User = require('../models/User');

async function setupChat(sender, receiver) {
  try {
    const chat = new Chat({
      participants: [sender._id, receiver._id],
    });
    await chat.save();
    sender.chats.push({ chatId: chat._id, friendId: receiver._id });
    await sender.save();
    receiver.chats.push({ chatId: chat._id, friendId: sender._id });
    await receiver.save();
  } catch (err) {
    console.error('Error in setupChat:', err.message);
    throw new Error('Chat could not be created');
  }
}

async function getChat(chatId, userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
       
        throw new Error('User not found');
      }
  
      const userChat = user.chats.find((chat) => chat.chatId.toString() === chatId);
      if (!userChat) {
        throw new Error('Chat not found');
      }
  
      const chatData = await Chat.findById(chatId).populate('messages.from', 'name');
      return chatData;
    } catch (err) {
      console.error('Error in getChat:', err.message);
      throw err;
    }
  }

async function pushMessageToChat(chatId, userId, text) {
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    const message = { from: userId, text };
    chat.messages.push(message);
    await chat.save();

    return chat;
  } catch (err) {
    console.error('Error in pushMessageToChat:', err.message);
    throw err;
  }
}

module.exports = {
  setupChat,
  getChat,
  pushMessageToChat,
};