const request = require('supertest');
const app = require('../../src/app');

describe('Dashboard Routes - Integration Tests', () => {

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
