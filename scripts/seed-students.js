const { db } = require('../src/config/firebase');

const students = [
  { name: 'Ana María López',       email: 'ana.lopez@estudiante.una.ac.cr',      career: 'Informática',            semester: 1 },
  { name: 'Carlos Rodríguez',      email: 'carlos.rodriguez@estudiante.una.ac.cr', career: 'Administración',       semester: 2 },
  { name: 'María Fernanda Pérez',  email: 'mf.perez@estudiante.una.ac.cr',       career: 'Informática',            semester: 3 },
  { name: 'Luis Diego Mora',       email: 'ld.mora@estudiante.una.ac.cr',         career: 'Contabilidad',          semester: 4 },
  { name: 'Valeria Jiménez',       email: 'valeria.jimenez@estudiante.una.ac.cr', career: 'Informática',           semester: 5 },
  { name: 'Diego Alvarado',        email: 'diego.alvarado@estudiante.una.ac.cr',  career: 'Administración',        semester: 1 },
  { name: 'Sofía Castro',          email: 'sofia.castro@estudiante.una.ac.cr',    career: 'Economía',              semester: 2 },
  { name: 'Andrés Vargas',         email: 'andres.vargas@estudiante.una.ac.cr',   career: 'Informática',           semester: 6 },
  { name: 'Gabriela Solano',       email: 'gabriela.solano@estudiante.una.ac.cr', career: 'Contabilidad',          semester: 3 },
  { name: 'José Pablo Ureña',      email: 'jp.urena@estudiante.una.ac.cr',        career: 'Administración',        semester: 4 },
  { name: 'Daniela Rojas',         email: 'daniela.rojas@estudiante.una.ac.cr',   career: 'Economía',              semester: 5 },
  { name: 'Ricardo Chaves',        email: 'ricardo.chaves@estudiante.una.ac.cr',  career: 'Informática',           semester: 2 },
  { name: 'Melissa Araya',         email: 'melissa.araya@estudiante.una.ac.cr',   career: 'Contabilidad',          semester: 1 },
  { name: 'Esteban Quesada',       email: 'esteban.quesada@estudiante.una.ac.cr', career: 'Administración',        semester: 6 },
  { name: 'Paola Herrera',         email: 'paola.herrera@estudiante.una.ac.cr',   career: 'Economía',              semester: 3 },
  { name: 'Fabián Gutiérrez',      email: 'fabian.gutierrez@estudiante.una.ac.cr','career': 'Informática',         semester: 4 },
  { name: 'Camila Núñez',          email: 'camila.nunez@estudiante.una.ac.cr',    career: 'Administración',        semester: 5 },
  { name: 'Sebastián Blanco',      email: 'sebastian.blanco@estudiante.una.ac.cr',career: 'Contabilidad',          semester: 2 },
  { name: 'Laura Sandoval',        email: 'laura.sandoval@estudiante.una.ac.cr',  career: 'Economía',              semester: 1 },
  { name: 'Manuel Espinoza',       email: 'manuel.espinoza@estudiante.una.ac.cr', career: 'Informática',           semester: 3 },
  { name: 'Natalia Brenes',        email: 'natalia.brenes@estudiante.una.ac.cr',  career: 'Administración',        semester: 4 },
  { name: 'Alejandro Monge',       email: 'alejandro.monge@estudiante.una.ac.cr', career: 'Contabilidad',          semester: 6 },
  { name: 'Isabella Fonseca',      email: 'isabella.fonseca@estudiante.una.ac.cr',career: 'Economía',              semester: 5 },
  { name: 'David Calderón',        email: 'david.calderon@estudiante.una.ac.cr',  career: 'Informática',           semester: 2 },
  { name: 'Fernanda Arias',        email: 'fernanda.arias@estudiante.una.ac.cr',  career: 'Administración',        semester: 1 },
  { name: 'Óscar Méndez',          email: 'oscar.mendez@estudiante.una.ac.cr',    career: 'Contabilidad',          semester: 3 },
];

async function seed() {
  console.log('Insertando 26 estudiantes en Firestore...');

  const batch = db.batch();

  for (const student of students) {
    const ref = db.collection('users').doc();
    batch.set(ref, {
      id: ref.id,
      name: student.name,
      email: student.email,
      career: student.career,
      semester: student.semester,
      role: 'student',
      createdAt: new Date()
    });
  }

  await batch.commit();
  console.log(`✓ ${students.length} estudiantes insertados correctamente.`);
  process.exit(0);
}

seed().catch(err => {
  console.error('Error al insertar estudiantes:', err);
  process.exit(1);
});
