const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  participiants: [{ type: String, ref: 'User' }],
  messages: [
    {
      from: { type: Number, ref: 'User' },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      isDeleted: { type: Boolean, default: false },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Chat', ChatSchema);
