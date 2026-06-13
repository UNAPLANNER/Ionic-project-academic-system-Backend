jest.mock('../../src/config/firebase', () => ({
  auth: { verifyIdToken: jest.fn() },
  db: { collection: jest.fn() },
}));

const request = require('supertest');
const app = require('../../src/app');
const { auth, db } = require('../../src/config/firebase');

const makeDocRef = (exists = true, data = {}, id = 'doc-id') => ({
  id,
  get: jest.fn().mockResolvedValue({ exists, id, data: () => data }),
  set: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined),
});

const makeQuerySnap = (docs = []) => ({
  empty: docs.length === 0,
  docs: docs.map(doc => ({ id: doc.id, data: () => doc })),
  get: jest.fn(),
});

const setupAuth = (role = 'admin', uid = `${role}-uid`) => {
  auth.verifyIdToken.mockResolvedValue({ uid });
  const userDoc = makeDocRef(true, { role }, uid);
  return { uid, userDoc };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Courses routes', () => {
  test('GET /api/courses devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/courses');

    expect(res.status).toBe(401);
  });

  test('GET /api/courses devuelve lista para administrador autenticado', async () => {
    const { uid, userDoc } = setupAuth('admin', 'admin-uid');
    const coursesSnap = makeQuerySnap([
      { id: 'course-1', name: 'Moviles', code: 'MOV202', credits: 3, schedule: 'Lunes', students: [] },
    ]);
    coursesSnap.get.mockResolvedValue(coursesSnap);

    db.collection.mockImplementation(collection => {
      if (collection === 'users') {
        return { doc: jest.fn().mockImplementation(id => id === uid ? userDoc : makeDocRef(false)) };
      }
      if (collection === 'courses') {
        return coursesSnap;
      }
      return {};
    });

    const res = await request(app)
      .get('/api/courses')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.courses).toHaveLength(1);
  });

  test('POST /api/courses devuelve 403 si el usuario no es administrador', async () => {
    const { uid, userDoc } = setupAuth('student', 'student-uid');
    db.collection.mockImplementation(collection => {
      if (collection === 'users') {
        return { doc: jest.fn().mockImplementation(id => id === uid ? userDoc : makeDocRef(false)) };
      }
      return {};
    });

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', 'Bearer token')
      .send({ name: 'Curso', code: 'CUR101', credits: 3, schedule: 'Lunes' });

    expect(res.status).toBe(403);
  });

  test('POST /api/courses crea curso con rol administrador', async () => {
    const { uid, userDoc } = setupAuth('admin', 'admin-uid');
    const emptySnap = makeQuerySnap([]);
    emptySnap.get.mockResolvedValue(emptySnap);
    const courseRef = makeDocRef(false, {}, 'course-new');

    db.collection.mockImplementation(collection => {
      if (collection === 'users') {
        return { doc: jest.fn().mockImplementation(id => id === uid ? userDoc : makeDocRef(false)) };
      }
      if (collection === 'courses') {
        return {
          where: jest.fn().mockReturnValue(emptySnap),
          doc: jest.fn().mockReturnValue(courseRef),
        };
      }
      return {};
    });

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', 'Bearer token')
      .send({
        name: 'Arquitectura',
        code: 'ARQ101',
        credits: 4,
        schedule: 'Martes 18:00-20:00',
        teacherId: 'teacher-1',
      });

    expect(res.status).toBe(201);
    expect(res.body.course).toMatchObject({
      id: 'course-new',
      code: 'ARQ101',
      teacherId: 'teacher-1',
    });
  });

  test('PUT /api/courses/:id/students asigna estudiantes como administrador', async () => {
    const { uid, userDoc } = setupAuth('admin', 'admin-uid');
    const courseRef = makeDocRef(true, { id: 'course-1', name: 'Curso', students: [] }, 'course-1');

    db.collection.mockImplementation(collection => {
      if (collection === 'users') {
        return { doc: jest.fn().mockImplementation(id => id === uid ? userDoc : makeDocRef(false)) };
      }
      if (collection === 'courses') {
        return { doc: jest.fn().mockReturnValue(courseRef) };
      }
      return {};
    });

    const res = await request(app)
      .put('/api/courses/course-1/students')
      .set('Authorization', 'Bearer token')
      .send({ students: ['s1', 's1', 's2'] });

    expect(res.status).toBe(200);
    expect(res.body.course.totalStudents).toBe(2);
  });
});
