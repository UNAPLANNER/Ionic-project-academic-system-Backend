const { auth, db } = require('../config/firebase');

// Verify that the Firebase ID token sent by the mobile app is valid
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await auth.verifyIdToken(token);

    // Role comes from Firestore since custom claims are not set on Firebase Auth
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const role = userDoc.exists ? (userDoc.data().role ?? null) : null;

    req.user = {
      uid: decoded.uid,
      role
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
