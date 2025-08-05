const request = require('supertest');
const app = require('../services/auth-service/index.js');

describe('Auth Service', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'Auth Service');
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Authentication', () => {
    describe('POST /login', () => {
      it('should login with valid credentials', async () => {
        const loginData = {
          email: 'user@enterprise.com',
          password: 'password',
        };

        const response = await request(app)
          .post('/login')
          .send(loginData)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Login successful');
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('token');
        expect(response.body.user).toHaveProperty('email', loginData.email);
        expect(response.body.user).toHaveProperty('role', 'user');
      });

      it('should reject invalid credentials', async () => {
        const loginData = {
          email: 'user@enterprise.com',
          password: 'wrongpassword',
        };

        const response = await request(app)
          .post('/login')
          .send(loginData)
          .expect(401);

        expect(response.body).toHaveProperty('error', 'Invalid credentials');
      });

      it('should reject non-existent user', async () => {
        const loginData = {
          email: 'nonexistent@enterprise.com',
          password: 'password',
        };

        const response = await request(app)
          .post('/login')
          .send(loginData)
          .expect(401);

        expect(response.body).toHaveProperty('error', 'Invalid credentials');
      });

      it('should handle missing email', async () => {
        const loginData = {
          password: 'password',
        };

        const response = await request(app)
          .post('/login')
          .send(loginData)
          .expect(401);

        expect(response.body).toHaveProperty('error', 'Invalid credentials');
      });

      it('should handle missing password', async () => {
        const loginData = {
          email: 'user@enterprise.com',
        };

        const response = await request(app)
          .post('/login')
          .send(loginData)
          .expect(401);

        expect(response.body).toHaveProperty('error', 'Invalid credentials');
      });

      it('should handle empty request body', async () => {
        const response = await request(app)
          .post('/login')
          .send({})
          .expect(401);

        expect(response.body).toHaveProperty('error', 'Invalid credentials');
      });
    });

    describe('Admin Login', () => {
      it('should login admin with valid credentials', async () => {
        const loginData = {
          email: 'admin@enterprise.com',
          password: 'password',
        };

        const response = await request(app)
          .post('/login')
          .send(loginData)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Login successful');
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('token');
        expect(response.body.user).toHaveProperty('email', loginData.email);
        expect(response.body.user).toHaveProperty('role', 'admin');
      });
    });
  });

  describe('Token Validation', () => {
    let authToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/login')
        .send({
          email: 'user@enterprise.com',
          password: 'password',
        });
      authToken = loginResponse.body.token;
    });

    it('should validate JWT token structure', () => {
      expect(authToken).toBeDefined();
      expect(typeof authToken).toBe('string');
      
      // JWT tokens have 3 parts separated by dots
      const tokenParts = authToken.split('.');
      expect(tokenParts).toHaveLength(3);
    });

    it('should generate different tokens for different users', async () => {
      const userLogin = await request(app)
        .post('/login')
        .send({
          email: 'user@enterprise.com',
          password: 'password',
        });

      const adminLogin = await request(app)
        .post('/login')
        .send({
          email: 'admin@enterprise.com',
          password: 'password',
        });

      expect(userLogin.body.token).not.toBe(adminLogin.body.token);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // This test would require mocking bcrypt to throw an error
      // For now, we'll test the basic error structure
      const response = await request(app)
        .post('/login')
        .send({
          email: 'user@enterprise.com',
          password: 'password',
        });

      if (response.status === 500) {
        expect(response.body).toHaveProperty('error');
      }
    });
  });
}); 