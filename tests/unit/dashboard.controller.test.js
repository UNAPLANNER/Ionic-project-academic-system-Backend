const dashboardController = require('../../src/controllers/dashboard.controller');

jest.mock('../../src/config/firebase', () => ({
  db: {
    collection: jest.fn()
  }
}));

describe('Dashboard Controller - Unit Tests', () => {

  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('should return metrics successfully', async () => {
      
      const mockDocs = [
        { data: () => ({ score: 80 }) },
        { data: () => ({ score: 90 }) }
      ];

      const collectionMock = {
        get: jest.fn().mockResolvedValue({
          docs: mockDocs
        })
      };

      const db = require('../../src/config/firebase').db;
      db.collection.mockReturnValue(collectionMock);

      await dashboardController.getMetrics(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors in getMetrics', async () => {
      const db = require('../../src/config/firebase').db;
      db.collection.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await dashboardController.getMetrics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPerformance', () => {
    it('should return performance data', async () => {

      const mockDocs = [
        { data: () => ({ value: 70 }) },
        { data: () => ({ value: 85 }) }
      ];

      const collectionMock = {
        get: jest.fn().mockResolvedValue({
          docs: mockDocs
        })
      };

      const db = require('../../src/config/firebase').db;
      db.collection.mockReturnValue(collectionMock);

      await dashboardController.getPerformance(req, res);

      expect(res.json).toHaveBeenCalled();
    });

  });

});