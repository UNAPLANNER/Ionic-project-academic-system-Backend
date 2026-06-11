jest.mock('../../src/config/firebase', () => ({
  db: { collection: jest.fn() },
}));

const request = require('supertest');
const app = require('../../src/app');
const { db } = require('../../src/config/firebase');

const makeSnap = (docs = []) => ({
  size: docs.length,
  docs: docs.map(doc => ({
    id: doc.id,
    data: () => doc,
  })),
});

describe('Dashboard Routes - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const studentsSnap = makeSnap([
      { id: 'student-1', role: 'student', name: 'Student One' },
      { id: 'student-2', role: 'student', name: 'Student Two' },
    ]);
    const coursesSnap = makeSnap([
      { id: 'course-1', name: 'Moviles' },
      { id: 'course-2', name: 'Bases de Datos' },
    ]);
    const evaluationsSnap = makeSnap([
      { studentId: 'student-1', courseId: 'course-1', score: 90 },
      { studentId: 'student-2', courseId: 'course-2', score: 55 },
    ]);

    db.collection.mockImplementation(collection => {
      if (collection === 'users') {
        return {
          where: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(studentsSnap),
          }),
        };
      }

      if (collection === 'courses') {
        return {
          get: jest.fn().mockResolvedValue(coursesSnap),
        };
      }

      if (collection === 'evaluations') {
        return {
          get: jest.fn().mockResolvedValue(evaluationsSnap),
        };
      }

      return {
        get: jest.fn().mockResolvedValue(makeSnap()),
      };
    });
  });

  // POSITIVE TESTS
  describe('GET /api/dashboard/metrics', () => {

    it('should return 200 and metrics data', async () => {
      const res = await request(app)
        .get('/api/dashboard/metrics');

      expect(res.statusCode).toBe(200);
      expect(res.body).toBeDefined();
    });

    it('should return correct metrics structure', async () => {
      const res = await request(app)
        .get('/api/dashboard/metrics');

      expect(res.statusCode).toBe(200);

      expect(res.body).toHaveProperty('overallAverage');
      expect(res.body).toHaveProperty('totalCourses');
      expect(res.body).toHaveProperty('totalEvaluations');
      expect(res.body).toHaveProperty('totalStudents');
      expect(res.body).toHaveProperty('performanceByCourse');
    });

  });

  describe('GET /api/dashboard/performance', () => {

    it('should return 200 and performance data', async () => {
      const res = await request(app)
        .get('/api/dashboard/performance');

      expect(res.statusCode).toBe(200);
      expect(res.body).toBeDefined();
    });

  });


  // NEGATIVE TESTS
  describe('Negative tests', () => {

    it('should return 404 for invalid route', async () => {
      const res = await request(app)
        .get('/api/dashboard/invalid-route');

      expect(res.statusCode).toBe(404);
    });

    it('should return 404 for completely wrong endpoint', async () => {
      const res = await request(app)
        .get('/api/dashboard/metrics123');

      expect(res.statusCode).toBe(404);
    });

  });

});
