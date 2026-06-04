const { db } = require('../src/config/firebase');

const courses = [
  { name: 'Programación I',        code: 'INF-101', credits: 4, schedule: 'Lunes y Miércoles 7:00-9:00' },
  { name: 'Bases de Datos',        code: 'INF-201', credits: 4, schedule: 'Martes y Jueves 9:00-11:00' },
  { name: 'Redes de Computadoras', code: 'INF-301', credits: 3, schedule: 'Viernes 8:00-11:00' },
  { name: 'Cálculo I',             code: 'MAT-101', credits: 4, schedule: 'Lunes, Miércoles y Viernes 11:00-12:00' },
  { name: 'Inglés Técnico',        code: 'ING-101', credits: 2, schedule: 'Martes 14:00-16:00' },
];

async function seed() {
  console.log('Obteniendo estudiantes existentes...');

  // Get all students from Firestore
  const studentsSnap = await db.collection('users').where('role', '==', 'student').get();
  const studentIds = studentsSnap.docs.map(doc => doc.id);

  if (studentIds.length === 0) {
    console.error('No hay estudiantes en Firestore. Ejecuta seed-students.js primero.');
    process.exit(1);
  }

  console.log(`Encontrados ${studentIds.length} estudiantes. Creando cursos...`);

  // Get teacher (first user with role teacher)
  const teacherSnap = await db.collection('users').where('role', '==', 'teacher').limit(1).get();
  const teacherId = teacherSnap.empty ? null : teacherSnap.docs[0].id;

  // Distribute students evenly across courses
  const batch = db.batch();
  const chunkSize = Math.ceil(studentIds.length / courses.length);

  courses.forEach((course, i) => {
    const assigned = studentIds.slice(i * chunkSize, (i + 1) * chunkSize);
    const ref = db.collection('courses').doc();
    batch.set(ref, {
      id: ref.id,
      name: course.name,
      code: course.code,
      credits: course.credits,
      schedule: course.schedule,
      teacherId: teacherId ?? '',
      students: assigned,
      createdAt: new Date()
    });
    console.log(`  ${course.code} - ${course.name}: ${assigned.length} estudiantes`);
  });

  await batch.commit();
  console.log(`✓ ${courses.length} cursos insertados correctamente.`);
  process.exit(0);
}

seed().catch(err => {
  console.error('Error al insertar cursos:', err);
  process.exit(1);
});
