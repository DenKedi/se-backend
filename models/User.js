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
    bio: { type: String, default: '' },
    chats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }],
    friends: [{ type: Number, ref: 'User' }],
    pendingRequests: [
      {
        from: { type: Number, ref: 'User', required: true },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'denied'],
          default: 'pending',
        },
      },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Hash password before saving the user model
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

// Compare password for login validation
UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
