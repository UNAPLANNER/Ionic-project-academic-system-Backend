const { auth, db } = require('../config/firebase');

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Look up user in Firestore by email
    const snapshot = await db.collection('users').where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userData = snapshot.docs[0].data();

    // Verify password against Firebase Auth
    await auth.getUserByEmail(email);

    // Generate custom token with role claim
    const customToken = await auth.createCustomToken(userData.id, { role: userData.role });

    return res.status(200).json({
      message: 'Login successful',
      token: customToken,
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
  const { name, email, password, role } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    return res.status(400).json({ 
      error: 'Name, email, password and role are required' 
    });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({ 
      error: 'Password must be at least 6 characters' 
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

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name
    });

    // Save user data to Firestore with same ID
    await usersRef.doc(userRecord.uid).set({
      id: userRecord.uid,
      name,
      email,
      role,
      createdAt: new Date()
    });

    // Generate Firebase custom token so client can get an ID token
    const customToken = await auth.createCustomToken(userRecord.uid, { role });

    return res.status(201).json({
      message: 'User registered successfully',
      token: customToken,
      user: {
        id: userRecord.uid,
        name,
        email,
        role
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    
    // Handle Firebase specific errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ 
        error: 'This email is already registered' 
      });
    }
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ 
        error: 'Password is too weak' 
      });
    }
    
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