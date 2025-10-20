const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  participiants: [{ type: String, ref: 'User' }],
  messages: [
    {
      from: { type: String, ref: 'User' },
      text: { type: String, required: false }, // Legacy: for backward compatibility
      timestamp: { type: Date, default: Date.now },
      isDeleted: { type: Boolean, default: false },
      // Encryption fields
      isEncrypted: { type: Boolean, default: false },
      encryptedContent: { type: String, required: false }, // Base64 encrypted message
      iv: { type: String, required: false }, // Initialization Vector for AES
      encryptedKeys: [
        {
          userId: { type: String, ref: 'User' },
          encryptedKey: { type: String }, // AES key encrypted with user's public RSA key
          keyVersion: { type: Number, default: 1 },
        },
      ],
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Chat', ChatSchema);
