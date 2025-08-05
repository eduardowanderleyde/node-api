const request = require('supertest');
const app = require('../index.js');

describe('API Gateway', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('gateway', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
}); 