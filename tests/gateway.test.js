const request = require('supertest');
const app = require('../index.js');

describe('API Gateway', () => {
  describe('GET /health', () => {
    it('deve retornar status do gateway e serviços', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('gateway');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('services');
    });
  });

  describe('GET /api-docs', () => {
    it('deve retornar documentação da API', async () => {
      const response = await request(app)
        .get('/api-docs')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'API Gateway - Documentação');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body).toHaveProperty('examples');
    });
  });

  describe('POST /auth/register', () => {
    it('deve registrar usuário através do gateway', async () => {
      const userData = {
        email: 'gateway-test@exemplo.com',
        password: 'senha123',
        name: 'Usuário Gateway Test'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Usuário criado com sucesso');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
    });
  });

  describe('POST /auth/login', () => {
    it('deve fazer login através do gateway', async () => {
      const loginData = {
        email: 'user@exemplo.com',
        password: 'password'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login realizado com sucesso');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
    });
  });

  describe('GET /auth/verify', () => {
    it('deve verificar token através do gateway', async () => {
      // Primeiro fazer login para obter token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@exemplo.com',
          password: 'password'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Token válido');
      expect(response.body).toHaveProperty('user');
    });
  });

  describe('GET /products', () => {
    it('deve retornar erro sem autenticação', async () => {
      const response = await request(app)
        .get('/products')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Token de acesso necessário');
    });

    it('deve listar produtos com autenticação válida', async () => {
      // Primeiro fazer login para obter token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@exemplo.com',
          password: 'password'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/products?limit=5')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('user');
    });
  });

  describe('GET /categories', () => {
    it('deve retornar categorias com autenticação válida', async () => {
      // Primeiro fazer login para obter token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@exemplo.com',
          password: 'password'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/categories')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('user');
    });
  });

  describe('GET /products/:id', () => {
    it('deve buscar produto por ID com autenticação válida', async () => {
      // Primeiro fazer login para obter token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@exemplo.com',
          password: 'password'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/products/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('user');
    });
  });

  describe('GET /products/category/:category', () => {
    it('deve buscar produtos por categoria com autenticação válida', async () => {
      // Primeiro fazer login para obter token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@exemplo.com',
          password: 'password'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/products/category/electronics')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('category', 'electronics');
      expect(response.body).toHaveProperty('user');
    });
  });

  describe('DELETE /admin/cache', () => {
    it('deve retornar erro para usuário não-admin', async () => {
      // Fazer login com usuário comum
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@exemplo.com',
          password: 'password'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .delete('/admin/cache')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Acesso negado. Apenas administradores podem limpar o cache.');
    });

    it('deve limpar cache para usuário admin', async () => {
      // Fazer login com usuário admin
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@exemplo.com',
          password: 'password'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .delete('/admin/cache')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Cache limpo com sucesso');
      expect(response.body).toHaveProperty('clearedEntries');
      expect(response.body).toHaveProperty('user');
    });
  });

  describe('GET /admin/cache/stats', () => {
    it('deve retornar estatísticas do cache para admin', async () => {
      // Fazer login com usuário admin
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@exemplo.com',
          password: 'password'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/admin/cache/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('cacheSize');
      expect(response.body).toHaveProperty('entries');
      expect(response.body).toHaveProperty('user');
    });
  });

  describe('Rota 404', () => {
    it('deve retornar erro para rota inexistente', async () => {
      const response = await request(app)
        .get('/rota-inexistente')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Rota não encontrada');
      expect(response.body).toHaveProperty('message');
    });
  });
}); 