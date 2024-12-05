const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
  members: [{ type: Number, ref: "User" }],
  messages: [{
    from: { type: Number, ref: "User" },
    to: { type: Number, ref: "User" },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
  }]
  },
);

module.exports = mongoose.model("Chat", ChatSchema);
