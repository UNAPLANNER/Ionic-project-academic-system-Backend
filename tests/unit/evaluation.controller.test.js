const {
  createEvaluation
} = require('../../src/controllers/evaluation.controller');

jest.mock('../../src/config/firebase', () => ({
  db: {
    collection: jest.fn()
  }
}));

const { db } = require('../../src/config/firebase');

describe('Evaluation Controller', () => {

  let req;
  let res;

  beforeEach(() => {

    req = {
      body: {
        studentId: '1',
        courseId: '1',
        type: 'exam',
        score: 80,
        maxScore: 100,
        date: '2026-06-10',
        description: 'Parcial'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  //CONFIRMED CASE
  it('debe crear una evaluación correctamente', async () => {

    db.collection.mockReturnValue({
      add: jest.fn().mockResolvedValue({
        id: 'eval123'
      })
    });

    await createEvaluation(req, res);

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'eval123',
        studentId: '1',
        courseId: '1'
      })
    );
  });

  //NEGATIVE CASE
  it('debe retornar 500 cuando Firestore falla', async () => {

    db.collection.mockReturnValue({
      add: jest.fn().mockRejectedValue(
        new Error('Firestore Error')
      )
    });

    await createEvaluation(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Firestore Error'
    });
  });

});
