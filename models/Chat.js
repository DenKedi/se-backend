const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  participiants: [{ type: Number, ref: 'User' }],
  messages: [
    {
      sender: { type: Number, ref: 'User' },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      isDeleted: { type: Boolean, default: false },
    },
  ],
});

module.exports = mongoose.model('Chat', ChatSchema);
