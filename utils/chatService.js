const Chat = require('../models/Chat');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { request } = require('express');

async function setupChat(sender, receiver) {
    const chat = new Chat({
        participiants: [sender._id, receiver._id],
    });

    await chat.save();

    sender.chats.push({ chatId: chat._id, friendId: receiver._id });
    await sender.save();

    receiver.chats.push({ chatId: chat._id, friendId: sender._id });
    await receiver.save();
}

module.exports = {
    setupChat,
}
