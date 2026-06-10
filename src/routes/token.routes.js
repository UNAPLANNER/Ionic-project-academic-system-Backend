const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

router.post('/save-token', async (req, res) => {
  try {
    const { userId, deviceToken } = req.body;

    if (!userId || !deviceToken) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    await db.collection('users').doc(userId).set({
      deviceToken: deviceToken
    }, { merge: true });

    return res.json({ message: 'Token guardado correctamente' });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;