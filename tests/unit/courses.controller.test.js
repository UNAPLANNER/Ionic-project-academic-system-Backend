jest.mock('../../src/config/firebase', () => ({
  db: { collection: jest.fn() },
}));

jest.mock('../../src/models/course.model', () => ({
  validateCourseFields: jest.fn().mockReturnValue([]),
}));

const { db } = require('../../src/config/firebase');
const { validateCourseFields } = require('../../src/models/course.model');
const {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  updateCourseStudents,
  updateCourseTeacher,
} = require('../../src/controllers/courses.controller');

const makeReq = (body = {}, params = {}, user = { uid: 'admin-uid', role: 'admin' }) => ({
  body,
  params,
  user,
});

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

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

beforeEach(() => {
  jest.clearAllMocks();
  validateCourseFields.mockReturnValue([]);
});

describe('getCourses', () => {
  test('devuelve cursos con total de estudiantes', async () => {
    const snap = makeQuerySnap([
      {
        id: 'course-1',
        name: 'Programacion Movil',
        code: 'MOV202',
        credits: 3,
        schedule: 'Lunes 08:00-10:00',
        teacherId: 'teacher-1',
        students: ['s1', 's2'],
      },
    ]);
    snap.get.mockResolvedValue(snap);
    db.collection.mockReturnValue(snap);

    const res = makeRes();
    await getCourses(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      courses: [
        expect.objectContaining({
          id: 'course-1',
          code: 'MOV202',
          totalStudents: 2,
        }),
      ],
    });
  });
});

describe('createCourse', () => {
  test('devuelve 400 si faltan campos requeridos', async () => {
    validateCourseFields.mockReturnValueOnce(['name', 'code']);

    const res = makeRes();
    await createCourse(makeReq({ credits: 3, schedule: 'Lunes' }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Missing required fields'),
    }));
  });

  test('devuelve 409 si ya existe un curso con el codigo', async () => {
    const existing = makeQuerySnap([{ id: 'course-1', code: 'MOV202' }]);
    existing.get.mockResolvedValue(existing);
    db.collection.mockReturnValue({ where: jest.fn().mockReturnValue(existing) });

    const res = makeRes();
    await createCourse(makeReq({
      name: 'Programacion Movil',
      code: 'MOV202',
      credits: 3,
      schedule: 'Lunes',
    }), res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'A course with this code already exists' });
  });

  test('devuelve 201 al crear un curso como administrador', async () => {
    const empty = makeQuerySnap([]);
    empty.get.mockResolvedValue(empty);
    const docRef = makeDocRef(false, {}, 'new-course-id');
    db.collection.mockReturnValue({
      where: jest.fn().mockReturnValue(empty),
      doc: jest.fn().mockReturnValue(docRef),
    });

    const res = makeRes();
    await createCourse(makeReq({
      name: 'Bases de Datos',
      code: 'BD101',
      credits: 4,
      schedule: 'Martes 18:00-20:00',
      teacherId: 'teacher-1',
    }), res);

    expect(docRef.set).toHaveBeenCalledWith(expect.objectContaining({
      id: 'new-course-id',
      code: 'BD101',
      teacherId: 'teacher-1',
      students: [],
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('updateCourse', () => {
  test('devuelve 404 si el curso no existe', async () => {
    const docRef = makeDocRef(false, {}, 'missing-course');
    db.collection.mockReturnValue({ doc: jest.fn().mockReturnValue(docRef) });

    const res = makeRes();
    await updateCourse(makeReq({
      name: 'Curso',
      code: 'CUR101',
      credits: 3,
      schedule: 'Viernes',
    }, { id: 'missing-course' }), res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('devuelve 403 si profesor intenta actualizar curso ajeno', async () => {
    const docRef = makeDocRef(true, { teacherId: 'teacher-owner' }, 'course-1');
    db.collection.mockReturnValue({ doc: jest.fn().mockReturnValue(docRef) });

    const res = makeRes();
    await updateCourse(makeReq({
      name: 'Curso',
      code: 'CUR101',
      credits: 3,
      schedule: 'Viernes',
    }, { id: 'course-1' }, { uid: 'teacher-other', role: 'teacher' }), res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('deleteCourse', () => {
  test('devuelve 200 al eliminar curso existente', async () => {
    const docRef = makeDocRef(true, { teacherId: 'teacher-1' }, 'course-1');
    db.collection.mockReturnValue({ doc: jest.fn().mockReturnValue(docRef) });

    const res = makeRes();
    await deleteCourse(makeReq({}, { id: 'course-1' }), res);

    expect(docRef.delete).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Course deleted successfully' });
  });
});

describe('updateCourseStudents', () => {
  test('devuelve 400 si students no es un arreglo', async () => {
    const res = makeRes();
    await updateCourseStudents(makeReq({ students: 's1' }, { id: 'course-1' }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'students must be an array' });
  });

  test('elimina duplicados al asignar estudiantes', async () => {
    const docRef = makeDocRef(true, { name: 'Curso', students: [] }, 'course-1');
    db.collection.mockReturnValue({ doc: jest.fn().mockReturnValue(docRef) });

    const res = makeRes();
    await updateCourseStudents(makeReq({ students: ['s1', 's1', 's2'] }, { id: 'course-1' }), res);

    expect(docRef.update).toHaveBeenCalledWith(expect.objectContaining({
      students: ['s1', 's2'],
    }));
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('updateCourseTeacher', () => {
  test('devuelve 404 si el profesor no existe', async () => {
    const courseRef = makeDocRef(true, { name: 'Curso' }, 'course-1');
    const teacherRef = makeDocRef(false, {}, 'teacher-1');
    db.collection.mockImplementation(collection => ({
      doc: jest.fn().mockImplementation(id => {
        if (collection === 'courses' && id === 'course-1') return courseRef;
        if (collection === 'users' && id === 'teacher-1') return teacherRef;
        return makeDocRef(false);
      }),
    }));

    const res = makeRes();
    await updateCourseTeacher(makeReq({ teacherId: 'teacher-1' }, { id: 'course-1' }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Teacher not found' });
  });
});
