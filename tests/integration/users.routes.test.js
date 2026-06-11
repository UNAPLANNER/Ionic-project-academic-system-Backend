jest.mock('../../src/config/firebase', () => ({
  auth: {
    verifyIdToken: jest.fn(),
    createUser: jest.fn(),
  },
  db: { collection: jest.fn() },
}));

const request = require('supertest');
const app = require('../../src/app');
const { auth, db } = require('../../src/config/firebase');

const makeDocRef = (exists = true, data = {}, id = 'doc-id') => ({
  id,
  get: jest.fn().mockResolvedValue({ exists, id, data: () => data }),
  set: jest.fn().mockResolvedValue(undefined),
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

describe('Admin users routes', () => {
  test('GET /api/users/teachers devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/users/teachers');

    expect(res.status).toBe(401);
  });

  test('GET /api/users/teachers devuelve 403 si no es administrador', async () => {
    const { uid, userDoc } = setupAuth('teacher', 'teacher-uid');
    db.collection.mockImplementation(collection => {
      if (collection === 'users') {
        return { doc: jest.fn().mockImplementation(id => id === uid ? userDoc : makeDocRef(false)) };
      }
      return {};
    });

    const res = await request(app)
      .get('/api/users/teachers')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(403);
  });

  test('GET /api/users/teachers devuelve profesores si es administrador', async () => {
    const { uid, userDoc } = setupAuth('admin', 'admin-uid');
    const teachersSnap = makeQuerySnap([
      { id: 'teacher-1', name: 'Profe Uno', email: 'profe@test.com', role: 'teacher' },
    ]);
    teachersSnap.get.mockResolvedValue(teachersSnap);

    db.collection.mockImplementation(collection => {
      if (collection === 'users') {
        return {
          doc: jest.fn().mockImplementation(id => id === uid ? userDoc : makeDocRef(false)),
          where: jest.fn().mockReturnValue(teachersSnap),
        };
      }
      return {};
    });

    const res = await request(app)
      .get('/api/users/teachers')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.teachers).toEqual([
      expect.objectContaining({ id: 'teacher-1', role: 'teacher' }),
    ]);
  });

  test('POST /api/users/teachers crea profesor si es administrador', async () => {
    const { uid, userDoc } = setupAuth('admin', 'admin-uid');
    const emptySnap = makeQuerySnap([]);
    emptySnap.get.mockResolvedValue(emptySnap);
    const teacherDoc = makeDocRef(false, {}, 'teacher-new');
    auth.createUser.mockResolvedValue({ uid: 'teacher-new' });

    db.collection.mockImplementation(collection => {
      if (collection === 'users') {
        return {
          doc: jest.fn().mockImplementation(id => id === uid ? userDoc : teacherDoc),
          where: jest.fn().mockReturnValue(emptySnap),
        };
      }
      return {};
    });

    const res = await request(app)
      .post('/api/users/teachers')
      .set('Authorization', 'Bearer token')
      .send({
        name: 'Profe Nuevo',
        email: 'nuevo@test.com',
        password: '123456',
      });

    expect(res.status).toBe(201);
    expect(res.body.teacher).toMatchObject({
      id: 'teacher-new',
      role: 'teacher',
      email: 'nuevo@test.com',
    });
  });
});
