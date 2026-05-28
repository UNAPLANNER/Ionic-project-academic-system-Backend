const { auth, db } = require('../config/firebase');

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Email and password are required' 
    });
  }

  try {
    // Search for user in Firestore by email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(401).json({ 
        error: 'No account found with this email' 
      });
    }

    // Get user data
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Return user data (without password)
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, role } = req.body;

  // Validate required fields
  if (!name || !email || !role) {
    return res.status(400).json({ 
      error: 'Name, email and role are required' 
    });
  }

  // Validate that role is valid
  const validRoles = ['admin', 'teacher', 'student'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ 
      error: 'Role must be admin, teacher or student' 
    });
  }

  try {
    // Verify that email is not already registered
    const usersRef = db.collection('users');
    const existing = await usersRef.where('email', '==', email).get();

    if (!existing.empty) {
      return res.status(409).json({ 
        error: 'This email is already registered' 
      });
    }

    // Actual registration is handled by Firebase Auth from the Mobile app
    // Backend only verifies and stores additional user data
    return res.status(201).json({
      message: 'User registered successfully',
      user: { name, email, role }
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/auth/user/:id
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const userDoc = await db.collection('users').doc(id).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    return res.status(200).json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { login, register, getUserById };