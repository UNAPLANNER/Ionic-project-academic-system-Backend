const request = require('supertest');
const app = require('../../src/app');

jest.mock('../../src/config/firebase', () => ({
  db: {
    collection: jest.fn()
  }
}));

const { db } = require('../../src/config/firebase');

describe('Evaluation Routes', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //CONFIRMED CASE
  it('POST /api/evaluations debe crear evaluación', async () => {

    db.collection.mockReturnValue({
      add: jest.fn().mockResolvedValue({
        id: 'eval123'
      })
    });

    const response = await request(app)
      .post('/api/evaluations')
      .send({
        studentId: '1',
        courseId: '1',
        type: 'exam',
        score: 90,
        maxScore: 100,
        date: '2026-06-10',
        description: 'Parcial'
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.id).toBe('eval123');
  });

  // NEGATIVE CASE
  it('POST /api/evaluations debe retornar 500 si Firestore falla', async () => {

    db.collection.mockReturnValue({
      add: jest.fn().mockRejectedValue(
        new Error('Firestore Error')
      )
    });

    const response = await request(app)
      .post('/api/evaluations')
      .send({
        studentId: '1',
        courseId: '1',
        type: 'exam',
        score: 90,
        maxScore: 100,
        date: '2026-06-10',
        description: 'Parcial'
      });

    expect(response.statusCode).toBe(500);

    expect(response.body.message)
      .toBe('Firestore Error');
  });

});
