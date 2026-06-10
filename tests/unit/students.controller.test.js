jest.mock('../../src/config/firebase', () => ({
  db: { collection: jest.fn() },
}));

jest.mock('../../src/models/student.model', () => ({
  validateStudentFields: jest.fn().mockReturnValue([]),
}));

const { db } = require('../../src/config/firebase');
const { validateStudentFields } = require('../../src/models/student.model');
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../../src/controllers/students.controller');

// ── helpers ──────────────────────────────────────────────────────────────────

const makeReq = (body = {}, params = {}, user = {}) => ({ body, params, user });

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

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

beforeEach(() => {
  jest.clearAllMocks();
  validateStudentFields.mockReturnValue([]);
});

// ── getStudents ───────────────────────────────────────────────────────────────

describe('getStudents', () => {
  test('devuelve 200 con lista de estudiantes', async () => {
    const students = [
      { id: 's1', name: 'Pepe', email: 'pepe@test.com', career: 'CS', semester: 2, photoUrl: null },
    ];
    const snap = makeQuerySnap(students);
    snap.get.mockResolvedValue(snap);
    db.collection.mockReturnValue({ where: jest.fn().mockReturnValue(snap) });

    const res = makeRes();
    await getStudents(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ students: expect.any(Array) }));
  });

  test('devuelve 200 con lista vacía si no hay estudiantes', async () => {
    const snap = makeQuerySnap([]);
    snap.get.mockResolvedValue(snap);
    db.collection.mockReturnValue({ where: jest.fn().mockReturnValue(snap) });

    const res = makeRes();
    await getStudents(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ students: [] });
  });
});

// ── getStudentById ────────────────────────────────────────────────────────────

describe('getStudentById', () => {
  test('devuelve 404 si el documento no existe', async () => {
    const docRef = makeDocRef(false, {}, 's1');
    db.collection.mockReturnValue({ doc: jest.fn().mockReturnValue(docRef) });

    const res = makeRes();
    await getStudentById(makeReq({}, { id: 's1' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Student not found' });
  });

  test('devuelve 404 si el documento existe pero no es estudiante', async () => {
    const docRef = makeDocRef(true, { role: 'teacher' }, 's1');
    db.collection.mockReturnValue({ doc: jest.fn().mockReturnValue(docRef) });

    const res = makeRes();
    await getStudentById(makeReq({}, { id: 's1' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('devuelve 200 con datos del estudiante si existe', async () => {
    const data = { id: 's1', name: 'Marta', email: 'm@test.com', career: 'Math', semester: 3, photoUrl: null, role: 'student' };
    const docRef = makeDocRef(true, data, 's1');
    db.collection.mockReturnValue({ doc: jest.fn().mockReturnValue(docRef) });

    const res = makeRes();
    await getStudentById(makeReq({}, { id: 's1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Marta', career: 'Math' }));
  });
});

// ── createStudent ─────────────────────────────────────────────────────────────

describe('createStudent', () => {
  test('devuelve 400 si faltan campos requeridos', async () => {
    validateStudentFields.mockReturnValueOnce(['name', 'career']);
    const res = makeRes();
    await createStudent(makeReq({ email: 'a@b.com', semester: 1 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Missing') }));
  });

  test('devuelve 400 si semester no es un número positivo', async () => {
    const res = makeRes();
    await createStudent(makeReq({ name: 'Luis', email: 'a@b.com', career: 'CS', semester: 0 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'semester must be a positive number' });
  });

  test('devuelve 409 si el email ya existe', async () => {
    const snap = makeQuerySnap([{ email: 'a@b.com' }]);
    snap.get.mockResolvedValue(snap);
    db.collection.mockReturnValue({ where: jest.fn().mockReturnValue(snap) });

    const res = makeRes();
    await createStudent(makeReq({ name: 'Luis', email: 'a@b.com', career: 'CS', semester: 2 }), res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'A user with this email already exists' });
  });

  test('devuelve 201 al crear estudiante exitosamente', async () => {
    const emptySnap = makeQuerySnap([]);
    emptySnap.get.mockResolvedValue(emptySnap);
    const docRef = makeDocRef(false, {}, 'new-student-id');
    db.collection.mockReturnValue({
      where: jest.fn().mockReturnValue(emptySnap),
      doc:   jest.fn().mockReturnValue(docRef),
    });

    const res = makeRes();
    await createStudent(makeReq({ name: 'Laura', email: 'laura@test.com', career: 'CS', semester: 1 }), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Student created successfully' }));
  });
});

// ── updateStudent ─────────────────────────────────────────────────────────────

describe('updateStudent', () => {
  test('devuelve 400 si faltan campos requeridos', async () => {
    validateStudentFields.mockReturnValueOnce(['email']);
    const res = makeRes();
    await updateStudent(makeReq({ name: 'Luis', career: 'CS', semester: 2 }, { id: 's1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('devuelve 400 si semester no es un número positivo', async () => {
    const res = makeRes();
    await updateStudent(makeReq({ name: 'Luis', email: 'a@b.com', career: 'CS', semester: -1 }, { id: 's1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('devuelve 404 si el estudiante no existe', async () => {
    const docRef = makeDocRef(false, {}, 's1');
    db.collection.mockReturnValue({ doc: jest.fn().mockReturnValue(docRef) });

    const res = makeRes();
    await updateStudent(makeReq({ name: 'Luis', email: 'a@b.com', career: 'CS', semester: 2 }, { id: 's1' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Student not found' });
  });

  test('devuelve 200 al actualizar exitosamente', async () => {
    const existing = { id: 's1', name: 'Luis', email: 'old@test.com', career: 'CS', semester: 1, role: 'student' };
    const docRef = makeDocRef(true, existing, 's1');
    db.collection.mockReturnValue({ doc: jest.fn().mockReturnValue(docRef) });

    const res = makeRes();
    await updateStudent(makeReq({ name: 'Luis Updated', email: 'new@test.com', career: 'Math', semester: 3 }, { id: 's1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Student updated successfully' }));
  });
});

// ── deleteStudent ─────────────────────────────────────────────────────────────

describe('deleteStudent', () => {
  test('devuelve 404 si el estudiante no existe', async () => {
    const docRef = makeDocRef(false, {}, 's1');
    db.collection.mockReturnValue({ doc: jest.fn().mockReturnValue(docRef) });

    const res = makeRes();
    await deleteStudent(makeReq({}, { id: 's1' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Student not found' });
  });

  test('devuelve 404 si el documento existe pero no es estudiante', async () => {
    const docRef = makeDocRef(true, { role: 'teacher' }, 's1');
    db.collection.mockReturnValue({ doc: jest.fn().mockReturnValue(docRef) });

    const res = makeRes();
    await deleteStudent(makeReq({}, { id: 's1' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('devuelve 200 al eliminar exitosamente', async () => {
    const data = { id: 's1', name: 'Pepe', role: 'student' };
    const docRef = makeDocRef(true, data, 's1');
    db.collection.mockReturnValue({ doc: jest.fn().mockReturnValue(docRef) });

    const res = makeRes();
    await deleteStudent(makeReq({}, { id: 's1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Student deleted successfully' });
  });
});
