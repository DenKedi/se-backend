const Chat = require('../models/Chat');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { request } = require('express');

async function setupChat(users) {
    const chat = new Chat({
        participiants: users.map((user) => user._id),
    });
    await chat.save();
    for (const user of users) {
        user.chats.push(chat._id);
        await user.save();
    }
}

module.exports = {
    setupChat,
}
