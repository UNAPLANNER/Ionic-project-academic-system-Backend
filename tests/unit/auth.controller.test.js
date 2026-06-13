jest.mock('../../src/config/firebase', () => ({
  auth: {
    createUser: jest.fn(),
    createCustomToken: jest.fn(),
  },
  db: {
    collection: jest.fn(),
  },
}));

const { auth, db } = require('../../src/config/firebase');
const { login, register, getUserById } = require('../../src/controllers/auth.controller');

// ── helpers ──────────────────────────────────────────────────────────────────

const makeReq = (body = {}, params = {}) => ({ body, params });

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const makeQuery = (docs = []) => ({
  empty: docs.length === 0,
  docs:  docs.map(d => ({ id: d.id || 'doc-id', data: () => d })),
  get:   jest.fn(),
});

const makeDocRef = (exists = true, data = {}, id = 'doc-id') => ({
  id,
  get:    jest.fn().mockResolvedValue({ exists, data: () => data }),
  set:    jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
});

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

// ── login ─────────────────────────────────────────────────────────────────────

describe('login', () => {
  test('devuelve 400 si falta email', async () => {
    const res = makeRes();
    await login(makeReq({ password: 'pass123' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
  });

  test('devuelve 400 si falta password', async () => {
    const res = makeRes();
    await login(makeReq({ email: 'a@b.com' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('devuelve 401 si Firebase rechaza las credenciales', async () => {
    global.fetch.mockResolvedValue({ ok: false });
    const res = makeRes();
    await login(makeReq({ email: 'a@b.com', password: 'wrong' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
  });

  test('devuelve 401 si el usuario no existe en Firestore', async () => {
    global.fetch.mockResolvedValue({
      ok:   true,
      json: jest.fn().mockResolvedValue({ idToken: 'tok' }),
    });
    const snap = makeQuery([]);
    snap.get.mockResolvedValue(snap);
    const collection = { where: jest.fn().mockReturnValue(snap) };
    db.collection.mockReturnValue(collection);

    const res = makeRes();
    await login(makeReq({ email: 'a@b.com', password: 'pass' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('devuelve 200 con token y datos de usuario al hacer login exitoso', async () => {
    global.fetch.mockResolvedValue({
      ok:   true,
      json: jest.fn().mockResolvedValue({ idToken: 'id-token-xyz' }),
    });
    const userData = { id: 'u1', name: 'Ana', email: 'ana@test.com', role: 'teacher' };
    const snap = makeQuery([userData]);
    snap.get.mockResolvedValue(snap);
    const collection = { where: jest.fn().mockReturnValue(snap) };
    db.collection.mockReturnValue(collection);

    const res = makeRes();
    await login(makeReq({ email: 'ana@test.com', password: 'pass123' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      token: 'id-token-xyz',
      user:  expect.objectContaining({ email: 'ana@test.com', role: 'teacher' }),
    }));
  });
});

// ── register ──────────────────────────────────────────────────────────────────

describe('register', () => {
  test('devuelve 400 si faltan campos obligatorios', async () => {
    const res = makeRes();
    await register(makeReq({ email: 'a@b.com', password: 'pass123' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('devuelve 400 si password tiene menos de 6 caracteres', async () => {
    const res = makeRes();
    await register(makeReq({ name: 'Ana', email: 'a@b.com', password: '123', role: 'student' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Password must be at least 6 characters' });
  });

  test('devuelve 400 si el rol no es válido', async () => {
    const res = makeRes();
    await register(makeReq({ name: 'Ana', email: 'a@b.com', password: 'pass123', role: 'superadmin' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Role must be admin, teacher or student' });
  });

  test('devuelve 409 si el email ya está registrado', async () => {
    const snap = makeQuery([{ email: 'a@b.com' }]);
    snap.get.mockResolvedValue(snap);
    const collection = { where: jest.fn().mockReturnValue(snap) };
    db.collection.mockReturnValue(collection);

    const res = makeRes();
    await register(makeReq({ name: 'Ana', email: 'a@b.com', password: 'pass123', role: 'student' }), res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('devuelve 201 al registrar usuario exitosamente', async () => {
    const emptySnap = makeQuery([]);
    emptySnap.get.mockResolvedValue(emptySnap);
    const docRef = makeDocRef(false, {}, 'new-uid');
    const collection = {
      where: jest.fn().mockReturnValue(emptySnap),
      doc:   jest.fn().mockReturnValue(docRef),
    };
    db.collection.mockReturnValue(collection);
    auth.createUser.mockResolvedValue({ uid: 'new-uid' });
    auth.createCustomToken.mockResolvedValue('custom-tok');

    const res = makeRes();
    await register(makeReq({ name: 'Luis', email: 'luis@test.com', password: 'pass123', role: 'student' }), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'User registered successfully',
      token:   'custom-tok',
    }));
  });

  test('devuelve 409 si Firebase lanza auth/email-already-exists', async () => {
    const emptySnap = makeQuery([]);
    emptySnap.get.mockResolvedValue(emptySnap);
    db.collection.mockReturnValue({ where: jest.fn().mockReturnValue(emptySnap) });
    auth.createUser.mockRejectedValue({ code: 'auth/email-already-exists' });

    const res = makeRes();
    await register(makeReq({ name: 'Luis', email: 'luis@test.com', password: 'pass123', role: 'student' }), res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
});

// ── getUserById ───────────────────────────────────────────────────────────────

describe('getUserById', () => {
  test('devuelve 404 si el usuario no existe', async () => {
    const docRef = makeDocRef(false);
    db.collection.mockReturnValue({ doc: jest.fn().mockReturnValue(docRef) });

    const res = makeRes();
    await getUserById(makeReq({}, { id: 'no-existe' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  test('devuelve 200 con los datos del usuario si existe', async () => {
    const userData = { id: 'u1', name: 'Carla', email: 'carla@test.com', role: 'admin' };
    const docRef = makeDocRef(true, userData, 'u1');
    db.collection.mockReturnValue({ doc: jest.fn().mockReturnValue(docRef) });

    const res = makeRes();
    await getUserById(makeReq({}, { id: 'u1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      user: expect.objectContaining({ name: 'Carla', role: 'admin' }),
    }));
  });
});
