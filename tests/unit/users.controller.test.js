jest.mock('../../src/config/firebase', () => ({
  auth: { createUser: jest.fn() },
  db: { collection: jest.fn() },
}));

jest.mock('../../src/models/user.model', () => ({
  validateUserFields: jest.fn().mockReturnValue([]),
  toUserResponse: jest.fn(doc => {
    const data = doc.data();
    return {
      id: data.id ?? doc.id,
      name: data.name,
      email: data.email,
      role: data.role,
    };
  }),
}));

const { auth, db } = require('../../src/config/firebase');
const { validateUserFields } = require('../../src/models/user.model');
const { getTeachers, createTeacher } = require('../../src/controllers/users.controller');

const makeReq = (body = {}) => ({ body });

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeQuerySnap = (docs = []) => ({
  empty: docs.length === 0,
  docs: docs.map(doc => ({ id: doc.id, data: () => doc })),
  get: jest.fn(),
});

beforeEach(() => {
  jest.clearAllMocks();
  validateUserFields.mockReturnValue([]);
});

describe('getTeachers', () => {
  test('devuelve profesores registrados para administracion', async () => {
    const snap = makeQuerySnap([
      { id: 'teacher-1', name: 'Profe Uno', email: 'profe@test.com', role: 'teacher' },
    ]);
    snap.get.mockResolvedValue(snap);
    db.collection.mockReturnValue({ where: jest.fn().mockReturnValue(snap) });

    const res = makeRes();
    await getTeachers(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      teachers: [
        {
          id: 'teacher-1',
          name: 'Profe Uno',
          email: 'profe@test.com',
          role: 'teacher',
        },
      ],
    });
  });
});

describe('createTeacher', () => {
  test('devuelve 400 si faltan campos requeridos', async () => {
    validateUserFields.mockReturnValueOnce(['name']);

    const res = makeRes();
    await createTeacher(makeReq({ email: 'teacher@test.com', password: '123456' }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Missing required fields'),
    }));
  });

  test('devuelve 400 si la contrasena es muy corta', async () => {
    const res = makeRes();
    await createTeacher(makeReq({
      name: 'Profe',
      email: 'teacher@test.com',
      password: '123',
    }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Password must be at least 6 characters' });
  });

  test('devuelve 409 si el email ya existe', async () => {
    const existing = makeQuerySnap([{ email: 'teacher@test.com' }]);
    existing.get.mockResolvedValue(existing);
    db.collection.mockReturnValue({ where: jest.fn().mockReturnValue(existing) });

    const res = makeRes();
    await createTeacher(makeReq({
      name: 'Profe',
      email: 'teacher@test.com',
      password: '123456',
    }), res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('devuelve 201 al crear profesor exitosamente', async () => {
    const empty = makeQuerySnap([]);
    empty.get.mockResolvedValue(empty);
    const set = jest.fn().mockResolvedValue(undefined);
    db.collection.mockImplementation(collection => {
      if (collection === 'users') {
        return {
          where: jest.fn().mockReturnValue(empty),
          doc: jest.fn().mockReturnValue({ set }),
        };
      }
      return {};
    });
    auth.createUser.mockResolvedValue({ uid: 'teacher-1' });

    const res = makeRes();
    await createTeacher(makeReq({
      name: 'Profe Nueva',
      email: 'nueva@test.com',
      password: '123456',
    }), res);

    expect(auth.createUser).toHaveBeenCalledWith({
      email: 'nueva@test.com',
      password: '123456',
      displayName: 'Profe Nueva',
    });
    expect(set).toHaveBeenCalledWith(expect.objectContaining({
      id: 'teacher-1',
      role: 'teacher',
    }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Teacher created successfully',
    }));
  });
});
