const { auth, db } = require('../config/firebase');
const jwt = require('jsonwebtoken');
const { createPublicKey } = require('crypto');

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const publicKey = privateKey
  ? createPublicKey(privateKey).export({ type: 'spki', format: 'pem' })
  : null;

// Verify that Firebase custom token is valid
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    if (!publicKey) {
      return res.status(500).json({ error: 'Server misconfigured: missing private key' });
    }

    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

    req.user = {
      uid: decoded.uid,
      role: decoded.claims?.role ?? null
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Verify that user has the required role
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access forbidden: insufficient role' });
    }
    next();
  };
};

module.exports = { verifyToken, checkRole };
