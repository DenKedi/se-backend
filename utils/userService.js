const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('./emailService');
const { request } = require('express');
const { setupChat } = require('./chatService');

async function registerUser({ displayed_name, email, password }) {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Benutzer mit dieser E-Mail existiert bereits');
  }

  const lastUser = await User.findOne().sort({ user_id: -1 });
  const nextUserId = lastUser ? lastUser.user_id + 1 : 1;

  const newUser = new User({
    user_id: nextUserId,
    displayed_name,
    email,
    password,
  });

  try {
    const confirmationToken = generateConfirmationToken(newUser.id);
    const confirmUrl = `http://localhost:4200/confirm-email?token=${confirmationToken}`;
    const emailSubject = 'Bestätige deine E-Mail Adresse für Plausch';
    const emailContent = `Bitte folge diesem Link, um deine E-Mail Adresse zu bestätigen: <a href="${confirmUrl}">Klick</a>`;

    await sendEmail(newUser.email, emailSubject, emailContent);
    console.log('Confirmation Token:', confirmationToken);

    await newUser.save();
    return newUser;
  } catch (err) {
    console.error('Error in registerUser:', err.message);
    throw new Error('Token konnte nicht generiert werden');
  }
}

async function findUserByEmail(email) {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`User with email ${email} not found`);
      throw new Error('User nicht gefunden');
    }
    return user;
  } catch (err) {
    console.error('Error in findUserByEmail:', err.message);
    throw new Error('User nicht gefunden');
  }
}

async function findUserById(id) {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User nicht gefunden');
    }
    return user; // Return the user
  } catch (err) {
    throw new Error('User nicht gefunden');
  }
}

async function handleFriendRequest(sender, receiver) {
  try {
    // Case 1: Receiver is the Sender
    if (receiver._id.toString() === sender._id.toString()) {
      return {
        msg: 'Du kannst dir nicht selbst eine Freundschaftsanfrage senden',
        status: 400,
      };
    } 

    // Case 2: Sender has a pending request from the receiver
    if (sender.pendingRequests) {
      for (let request of sender.pendingRequests) { 
        if (request.from && request.from.toString() === receiver._id.toString()) {
          await acceptFriendRequest(sender, receiver);
          return { msg: 'Freundschaftsanfrage angenommen', status: 200 };
        }
      }
    }
   
    // Case 3: Sender and receiver are already friends
    if (sender.friends && sender.friends.includes(receiver._id.toString())) {
      return { msg: 'Ihr seid bereits Freunde', status: 200 };
    } 

    // Case 4: Sender has already sent a request to the receiver
    const existingRequest = receiver.pendingRequests.find(
      request =>
        request.from && request.from.toString() === sender._id.toString()
    );

    if (existingRequest) {
      if (existingRequest.status === 'denied') {
        return { msg: 'Freundschaftsanfrage wurde abgelehnt', status: 200 };
      } else if (existingRequest.status === 'pending') {
        return { msg: 'Freundschaftsanfrage bereits gesendet', status: 200 };
      }
    } 

    // Case 5: Sender has not sent a request to the receiver
    receiver.pendingRequests.push({ from: sender._id });
    await receiver.save();
    return { msg: 'Freundschaftsanfrage gesendet', status: 200 };
  } catch (err) {
    console.error('Error in handleFriendRequest:', err.message);
    throw new Error('Freundschaftsanfrage konnte nicht bearbeitet werden');
  }
}

async function acceptFriendRequest(sender, receiver) {
  const request = receiver.pendingRequests.filter(
    request => request.from.toString() === sender._id.toString()
  )[0];
  if (!request) {
    return { msg: 'Freundschaftsanfrage nicht gefunden', status: 404 };
  }

  sender.friends.push(receiver._id);
  receiver.friends.push(sender._id);

  sender.pendingRequests = sender.pendingRequests.filter(
    request => request.from.toString() !== receiver._id.toString()
  );
  receiver.pendingRequests = receiver.pendingRequests.filter(
    request => request.from.toString() !== sender._id.toString()
  );

  await sender.save();
  await receiver.save();
  // NEU
  await setupChat(sender, receiver);
  // ENDE NEU
  return { msg: 'Freundschaftsanfrage angenommen', status: 200 };
}

async function denyFriendRequest(sender, receiver) {
  const request = receiver.pendingRequests.filter(
    request => request.from.toString() === sender._id.toString()
  )[0];
  if (!request) {
    return { msg: 'Freundschaftsanfrage nicht gefunden', status: 404 };
  }
  if (request.status === 'denied') {
    return { msg: 'Freundschaftsanfrage wurde bereits abgelehnt', status: 200 };
  }
  request.status = 'denied';

  receiver.pendingRequests = receiver.pendingRequests.map(request =>
    request.from.toString() === sender._id.toString()
      ? { ...request, status: 'denied' }
      : request
  );
  await receiver.save();
  return { msg: 'Freundschaftsanfrage abgelehnt', status: 200 };
}

function generateConfirmationToken(id) {
  try {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: '24h' });
  } catch (err) {
    console.error('Error generating confirmation token:', err.message);
    throw new Error('Token konnte nicht generiert werden');
  }
}

function generateSessionToken(user) {
  try {
    return jwt.sign({ user: user }, process.env.JWT_SECRET, {
      expiresIn: '360000',
    });
  } catch (err) {
    console.error('Error generating session token:', err);
    throw err;
  }
}

module.exports = {
  registerUser,
  findUserByEmail,
  findUserById,
  handleFriendRequest,
  acceptFriendRequest,
  denyFriendRequest,
  generateConfirmationToken,
  generateSessionToken,
};
