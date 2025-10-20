const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    user_id: { type: Number, required: true, unique: true },
    displayed_name: { type: String, required: true, unique: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isConfirmed: { type: Boolean, required: true, default: false },
    isVisible: { type: Boolean, required: true, default: true },
    hasSeenTutorial: { type: Boolean, default: false },
    bio: { type: String, default: '' },
    chats: [
      {
        chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
        friendId: { type: String, ref: 'User' },
      },
    ],
    friends: [{ type: String, ref: 'User' }],
    pendingRequests: [
      {
        from: { type: String, ref: 'User', required: true },
        status: {
          type: String,
          enum: ['pending', 'denied'],
          default: 'pending',
        },
      },
    ],
    // Encryption fields
    publicKey: {
      type: String,
      default: null,
    },
    keyVersion: {
      type: Number,
      default: 1,
    },
    lastKeyUpdate: {
      type: Date,
      default: Date.now,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
