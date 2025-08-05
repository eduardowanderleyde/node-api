const request = require('supertest');
const app = require('../services/auth-service/index.js');

describe('Auth Service', () => {
  describe('POST /register', () => {
    it('deve registrar um novo usuário com dados válidos', async () => {
      const userData = {
        email: 'teste@exemplo.com',
        password: 'senha123',
        name: 'Usuário Teste'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Usuário criado com sucesso');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('role', 'user');
    });

    it('deve retornar erro para email já cadastrado', async () => {
      const userData = {
        email: 'admin@exemplo.com',
        password: 'senha123',
        name: 'Usuário Duplicado'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email já cadastrado');
    });

    it('deve retornar erro para dados inválidos', async () => {
      const userData = {
        email: 'email-invalido',
        password: '123',
        name: ''
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const loginData = {
        email: 'user@exemplo.com',
        password: 'password'
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login realizado com sucesso');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('deve retornar erro para credenciais inválidas', async () => {
      const loginData = {
        email: 'user@exemplo.com',
        password: 'senha-errada'
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Credenciais inválidas');
    });

    it('deve retornar erro para usuário inexistente', async () => {
      const loginData = {
        email: 'naoexiste@exemplo.com',
        password: 'senha123'
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Credenciais inválidas');
    });
  });

  describe('GET /verify', () => {
    it('deve verificar token válido', async () => {
      // Primeiro fazer login para obter token
      const loginResponse = await request(app)
        .post('/login')
        .send({
          email: 'user@exemplo.com',
          password: 'password'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/verify')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Token válido');
      expect(response.body).toHaveProperty('user');
    });

    it('deve retornar erro para token ausente', async () => {
      const response = await request(app)
        .get('/verify')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Token de acesso necessário');
    });

    it('deve retornar erro para token inválido', async () => {
      const response = await request(app)
        .get('/verify')
        .set('Authorization', 'Bearer token-invalido')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Token inválido');
    });
  });

  describe('GET /profile', () => {
    it('deve retornar perfil do usuário com token válido', async () => {
      // Primeiro fazer login para obter token
      const loginResponse = await request(app)
        .post('/login')
        .send({
          email: 'user@exemplo.com',
          password: 'password'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'user@exemplo.com');
      expect(response.body.user).toHaveProperty('name', 'Usuário Comum');
    });
  });

  describe('GET /health', () => {
    it('deve retornar status do serviço', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'Auth Service');
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
}); 