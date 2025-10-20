/**
 * Migration script to fix empty participiants array in existing chats
 * Run with: node fix-chat-participants.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Chat = require('./models/Chat');
const User = require('./models/User');

async function fixChatParticipants() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all chats with empty participiants
    const chats = await Chat.find({ participiants: { $size: 0 } });
    console.log(`\n📊 Found ${chats.length} chats with empty participiants`);

    for (const chat of chats) {
      console.log(`\n🔍 Processing chat ${chat._id}...`);

      // Get all messages to find participants
      const userIds = [...new Set(chat.messages.map(m => m.from.toString()))];
      console.log(`   Found ${userIds.length} unique users from messages: ${userIds.join(', ')}`);

      if (userIds.length === 0) {
        console.log('   ⚠️  No messages found, trying to find from user.chats...');
        
        // Find users who have this chat in their chats array
        const users = await User.find({ 'chats.chatId': chat._id });
        const foundUserIds = users.map(u => u._id.toString());
        
        if (foundUserIds.length > 0) {
          chat.participiants = foundUserIds;
          console.log(`   ✅ Set participiants from user records: ${foundUserIds.join(', ')}`);
        } else {
          console.log('   ❌ Could not determine participants');
          continue;
        }
      } else {
        chat.participiants = userIds;
        console.log(`   ✅ Set participiants from messages`);
      }

      await chat.save();
      console.log(`   💾 Chat updated successfully`);
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

fixChatParticipants();
