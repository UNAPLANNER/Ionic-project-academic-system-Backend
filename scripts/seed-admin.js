const { auth, db } = require('../src/config/firebase');

const adminUser = {
  name: 'Administrador',
  email: 'admin@una.ac.cr',
  password: 'admin1234'
};

async function seedAdmin() {
  console.log('Creando usuario admin...');

  try {
    // Verificar si el email ya existe en Firestore
    const existing = await db.collection('users').where('email', '==', adminUser.email).get();
    if (!existing.empty) {
      console.log('⚠ Ya existe un usuario con ese email.');
      process.exit(0);
    }

    // Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email: adminUser.email,
      password: adminUser.password,
      displayName: adminUser.name
    });

    // Guardar en Firestore con rol admin
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      name: adminUser.name,
      email: adminUser.email,
      role: 'admin',
      createdAt: new Date()
    });

    console.log(`✓ Admin creado correctamente.`);
    console.log(`  Email:    ${adminUser.email}`);
    console.log(`  Password: ${adminUser.password}`);
    console.log(`  UID:      ${userRecord.uid}`);
    process.exit(0);

  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.error('✗ El email ya está registrado en Firebase Auth.');
    } else {
      console.error('✗ Error al crear admin:', error.message);
    }
    process.exit(1);
  }
}

seedAdmin();
