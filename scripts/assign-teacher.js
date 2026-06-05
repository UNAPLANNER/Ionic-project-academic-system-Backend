const { db } = require('../src/config/firebase');

// Replace with your teacher's UID from Firestore
const TEACHER_ID = process.argv[2];

async function assign() {
  if (!TEACHER_ID) {
    console.error('Usage: node scripts/assign-teacher.js <teacherId>');
    process.exit(1);
  }

  const snap = await db.collection('courses').get();
  const batch = db.batch();

  snap.docs.forEach(doc => {
    batch.update(doc.ref, { teacherId: TEACHER_ID });
  });

  await batch.commit();
  console.log(`✓ ${snap.size} cursos asignados al teacher ${TEACHER_ID}`);
  process.exit(0);
}

assign().catch(err => {
  console.error(err);
  process.exit(1);
});
