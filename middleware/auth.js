require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = function (reqOrSocket, resOrNext, next) {
  const isSocket = reqOrSocket.handshake !== undefined; // Determine if it's a Socket.io connection

  if (isSocket) {
    // Socket.io authentication
    const socket = reqOrSocket;
    const nextFunc = resOrNext;

    const token = socket.handshake.auth?.token || socket.handshake.headers?.token;
    if (!token) {
      return nextFunc(new Error('Authentication error: No token provided'));
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      const decoded = jwt.verify(token, jwtSecret);
      socket.user = decoded.user; // Attach user info to socket
      nextFunc();
    } catch (err) {
      nextFunc(new Error('Authentication error: Invalid token'));
    }
  } else {
    // Express authentication
    const req = reqOrSocket;
    const res = resOrNext;

    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded.user; // Attach user info to request
      next();
    } catch (err) {
      res.status(401).json({ msg: 'Token is not valid' });
    }
  }
};