/**
 * Integration tests: login -> token -> GET/POST/PUT/DELETE /api/students
 *
 * Firebase is fully mocked so no real network calls are made.
 * The tests verify the full HTTP stack: routes -> middleware -> controller.
 */

jest.mock('../../src/config/firebase', () => ({
  auth: {
    verifyIdToken:   jest.fn(),
    createUser:      jest.fn(),
    createCustomToken: jest.fn(),
  },
  db: { collection: jest.fn() },
}));

const request = require('supertest');
const app     = require('../../src/app');
const { auth, db } = require('../../src/config/firebase');

// ── mock helpers ──────────────────────────────────────────────────────────────

const makeDocRef = (exists = true, data = {}, id = 'doc-id') => ({
  id,
  get:    jest.fn().mockResolvedValue({ exists, data: () => data }),
  set:    jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined),
});

const makeQuerySnap = (docs = []) => ({
  empty: docs.length === 0,
  docs:  docs.map(d => ({ id: d.id || 'doc-id', data: () => d })),
  get:   jest.fn(),
});

/**
 * Sets up the auth middleware mock so every authenticated request is treated
 * as coming from an admin with uid = 'admin-uid'.
 * Returns the docRef used so individual tests can override behaviour if needed.
 */
const setupAdminAuth = () => {
  const ADMIN_UID = 'admin-uid';
  auth.verifyIdToken.mockResolvedValue({ uid: ADMIN_UID });
  const adminDocRef = makeDocRef(true, { role: 'admin' }, ADMIN_UID);
  return { ADMIN_UID, adminDocRef };
};

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  test('devuelve 400 si faltan campos', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('devuelve 401 con credenciales inválidas', async () => {
    global.fetch.mockResolvedValue({ ok: false });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid email or password');
  });

  test('devuelve 200 con token al hacer login exitoso (simula obtener token)', async () => {
    global.fetch.mockResolvedValue({
      ok:   true,
      json: jest.fn().mockResolvedValue({ idToken: 'firebase-id-token' }),
    });
    const userData = { id: 'admin-uid', name: 'Admin', email: 'admin@test.com', role: 'admin' };
    const snap = makeQuerySnap([userData]);
    snap.get.mockResolvedValue(snap);
    db.collection.mockReturnValue({ where: jest.fn().mockReturnValue(snap) });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'pass123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token', 'firebase-id-token');
    expect(res.body.user).toMatchObject({ role: 'admin' });
  });
});

// ── GET /api/students ─────────────────────────────────────────────────────────

describe('GET /api/students', () => {
  test('devuelve 401 si no se envía token', async () => {
    const res = await request(app).get('/api/students');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('devuelve 200 con lista de estudiantes usando el token obtenido del login', async () => {
    const { ADMIN_UID, adminDocRef } = setupAdminAuth();

    const students = [
      { id: 's1', name: 'Pepe', email: 'pepe@test.com', career: 'CS', semester: 2 },
    ];
    const studentsSnap = makeQuerySnap(students);
    studentsSnap.get.mockResolvedValue(studentsSnap);

    db.collection.mockImplementation((col) => {
      if (col === 'users') {
        return {
          doc:   jest.fn().mockImplementation(id => id === ADMIN_UID ? adminDocRef : makeDocRef(false)),
          where: jest.fn().mockReturnValue(studentsSnap),
        };
      }
      return {};
    });

    const res = await request(app)
      .get('/api/students')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('students');
    expect(res.body.students).toBeInstanceOf(Array);
  });
});

// ── POST /api/students ────────────────────────────────────────────────────────

describe('POST /api/students', () => {
  test('devuelve 400 si faltan campos obligatorios', async () => {
    const { adminDocRef } = setupAdminAuth();
    db.collection.mockImplementation((col) => {
      if (col === 'users') return { doc: jest.fn().mockReturnValue(adminDocRef) };
      return {};
    });

    const res = await request(app)
      .post('/api/students')
      .set('Authorization', 'Bearer mock-token')
      .send({ email: 'x@test.com' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('devuelve 201 al crear estudiante con token válido', async () => {
    const { ADMIN_UID, adminDocRef } = setupAdminAuth();

    const emptySnap = makeQuerySnap([]);
    emptySnap.get.mockResolvedValue(emptySnap);
    const newDocRef = makeDocRef(false, {}, 'new-student-id');

    db.collection.mockImplementation((col) => {
      if (col === 'users') {
        return {
          doc:   jest.fn().mockImplementation(id => id === ADMIN_UID ? adminDocRef : newDocRef),
          where: jest.fn().mockReturnValue(emptySnap),
        };
      }
      return {};
    });

    const res = await request(app)
      .post('/api/students')
      .set('Authorization', 'Bearer mock-token')
      .send({ name: 'Laura', email: 'laura@test.com', career: 'CS', semester: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Student created successfully');
  });
});

// ── PUT /api/students/:id ─────────────────────────────────────────────────────

describe('PUT /api/students/:id', () => {
  test('devuelve 404 si el estudiante no existe', async () => {
    const { ADMIN_UID, adminDocRef } = setupAdminAuth();
    const notFoundRef = makeDocRef(false, {}, 'no-existe');

    db.collection.mockImplementation((col) => {
      if (col === 'users') {
        return {
          doc: jest.fn().mockImplementation(id =>
            id === ADMIN_UID ? adminDocRef : notFoundRef
          ),
        };
      }
      return {};
    });

    const res = await request(app)
      .put('/api/students/no-existe')
      .set('Authorization', 'Bearer mock-token')
      .send({ name: 'X', email: 'x@test.com', career: 'CS', semester: 1 });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Student not found');
  });

  test('devuelve 200 al actualizar estudiante con token válido', async () => {
    const { ADMIN_UID, adminDocRef } = setupAdminAuth();
    const existingData = { id: 's1', name: 'Pepe', email: 'pepe@test.com', career: 'CS', semester: 1, role: 'student' };
    const studentDocRef = makeDocRef(true, existingData, 's1');

    db.collection.mockImplementation((col) => {
      if (col === 'users') {
        return {
          doc: jest.fn().mockImplementation(id =>
            id === ADMIN_UID ? adminDocRef : studentDocRef
          ),
        };
      }
      return {};
    });

    const res = await request(app)
      .put('/api/students/s1')
      .set('Authorization', 'Bearer mock-token')
      .send({ name: 'Pepe Updated', email: 'pepe@test.com', career: 'Math', semester: 3 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Student updated successfully');
  });
});

// ── DELETE /api/students/:id ──────────────────────────────────────────────────

describe('DELETE /api/students/:id', () => {
  test('devuelve 404 si el estudiante no existe', async () => {
    const { ADMIN_UID, adminDocRef } = setupAdminAuth();
    const notFoundRef = makeDocRef(false, {}, 'no-existe');

    db.collection.mockImplementation((col) => {
      if (col === 'users') {
        return {
          doc: jest.fn().mockImplementation(id =>
            id === ADMIN_UID ? adminDocRef : notFoundRef
          ),
        };
      }
      return {};
    });

    const res = await request(app)
      .delete('/api/students/no-existe')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(404);
  });

  test('devuelve 200 al eliminar estudiante con token válido', async () => {
    const { ADMIN_UID, adminDocRef } = setupAdminAuth();
    const studentDocRef = makeDocRef(true, { role: 'student' }, 's1');

    db.collection.mockImplementation((col) => {
      if (col === 'users') {
        return {
          doc: jest.fn().mockImplementation(id =>
            id === ADMIN_UID ? adminDocRef : studentDocRef
          ),
        };
      }
      return {};
    });

    const res = await request(app)
      .delete('/api/students/s1')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Student deleted successfully');
  });
});
