/**
 * Products Service - Enterprise Microservices Platform
 * Developed by Wander
 * 
 * Manages products and external API integration
 * Implements intelligent caching and data enrichment
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PRODUCTS_SERVICE_PORT || 3002;

// Middleware de segurança
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Muitas requisições, tente novamente mais tarde.'
});
app.use(limiter);

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Configuração do Axios para a API externa
const apiClient = axios.create({
  baseURL: process.env.EXTERNAL_API_URL || 'https://fakestoreapi.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para logs
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🌐 Requisição para: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Erro na requisição:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ Resposta recebida: ${response.status}`);
    return response;
  },
  (error) => {
    console.error('❌ Erro na resposta:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// Cache simples em memória
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Rotas
app.get('/health', (req, res) => {
  res.json({ 
    service: 'Products Service',
    status: 'OK',
    timestamp: new Date().toISOString(),
    cacheSize: cache.size
  });
});

// Listar todos os produtos
app.get('/products', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, sort = 'desc', category } = req.query;
    
    // Verificar cache
    const cacheKey = `products_${limit}_${sort}_${category || 'all'}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      return res.json({
        message: 'Produtos recuperados do cache',
        data: cachedData,
        cached: true,
        user: req.user
      });
    }

    // Construir URL da API
    let url = '/products';
    const params = [];
    
    if (limit) params.push(`limit=${limit}`);
    if (sort) params.push(`sort=${sort}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    // Fazer requisição para API externa
    const response = await apiClient.get(url);
    let products = response.data;

    // Filtrar por categoria se especificado
    if (category) {
      products = products.filter(product => 
        product.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Adicionar informações extras
    const enrichedProducts = products.map(product => ({
      ...product,
      internalId: `PROD_${product.id}`,
      fetchedAt: new Date().toISOString(),
      priceInBRL: (product.price * 5.5).toFixed(2), // Simulação de conversão
      discount: product.price > 100 ? 0.1 : 0 // 10% de desconto para produtos > $100
    }));

    // Salvar no cache
    setCachedData(cacheKey, enrichedProducts);

    res.json({
      message: 'Produtos recuperados com sucesso',
      data: enrichedProducts,
      total: enrichedProducts.length,
      user: req.user,
      cached: false
    });

  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar produtos',
      details: error.message 
    });
  }
});

// Buscar produto por ID
app.get('/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar cache
    const cacheKey = `product_${id}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      return res.json({
        message: 'Produto recuperado do cache',
        data: cachedData,
        cached: true,
        user: req.user
      });
    }

    // Fazer requisição para API externa
    const response = await apiClient.get(`/products/${id}`);
    const product = response.data;

    // Enriquecer dados do produto
    const enrichedProduct = {
      ...product,
      internalId: `PROD_${product.id}`,
      fetchedAt: new Date().toISOString(),
      priceInBRL: (product.price * 5.5).toFixed(2),
      discount: product.price > 100 ? 0.1 : 0,
      stock: Math.floor(Math.random() * 100) + 1, // Simulação de estoque
      rating: {
        ...product.rating,
        stars: '⭐'.repeat(Math.floor(product.rating.rate))
      }
    };

    // Salvar no cache
    setCachedData(cacheKey, enrichedProduct);

    res.json({
      message: 'Produto encontrado',
      data: enrichedProduct,
      user: req.user,
      cached: false
    });

  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.status(500).json({ 
      error: 'Erro ao buscar produto',
      details: error.message 
    });
  }
});

// Buscar categorias
app.get('/categories', authenticateToken, async (req, res) => {
  try {
    // Verificar cache
    const cacheKey = 'categories';
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      return res.json({
        message: 'Categorias recuperadas do cache',
        data: cachedData,
        cached: true,
        user: req.user
      });
    }

    // Fazer requisição para API externa
    const response = await apiClient.get('/products/categories');
    const categories = response.data;

    // Enriquecer categorias
    const enrichedCategories = categories.map(category => ({
      name: category,
      slug: category.toLowerCase().replace(/\s+/g, '-'),
      productCount: Math.floor(Math.random() * 50) + 5, // Simulação
      description: `Produtos da categoria ${category}`
    }));

    // Salvar no cache
    setCachedData(cacheKey, enrichedCategories);

    res.json({
      message: 'Categorias recuperadas com sucesso',
      data: enrichedCategories,
      total: enrichedCategories.length,
      user: req.user,
      cached: false
    });

  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar categorias',
      details: error.message 
    });
  }
});

// Buscar produtos por categoria
app.get('/products/category/:category', authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20, sort = 'desc' } = req.query;
    
    // Verificar cache
    const cacheKey = `category_${category}_${limit}_${sort}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      return res.json({
        message: 'Produtos da categoria recuperados do cache',
        data: cachedData,
        cached: true,
        user: req.user
      });
    }

    // Fazer requisição para API externa
    const response = await apiClient.get(`/products/category/${category}`);
    let products = response.data;

    // Aplicar limite se especificado
    if (limit) {
      products = products.slice(0, parseInt(limit));
    }

    // Ordenar se especificado
    if (sort === 'asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'desc') {
      products.sort((a, b) => b.price - a.price);
    }

    // Enriquecer produtos
    const enrichedProducts = products.map(product => ({
      ...product,
      internalId: `PROD_${product.id}`,
      fetchedAt: new Date().toISOString(),
      priceInBRL: (product.price * 5.5).toFixed(2),
      discount: product.price > 100 ? 0.1 : 0
    }));

    // Salvar no cache
    setCachedData(cacheKey, enrichedProducts);

    res.json({
      message: `Produtos da categoria ${category} recuperados`,
      data: enrichedProducts,
      category,
      total: enrichedProducts.length,
      user: req.user,
      cached: false
    });

  } catch (error) {
    console.error('Erro ao buscar produtos da categoria:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar produtos da categoria',
      details: error.message 
    });
  }
});

// Limpar cache (apenas para admin)
app.delete('/cache', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem limpar o cache.' });
  }

  const cacheSize = cache.size;
  cache.clear();

  res.json({
    message: 'Cache limpo com sucesso',
    clearedEntries: cacheSize,
    user: req.user
  });
});

// Estatísticas do cache (apenas para admin)
app.get('/cache/stats', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem ver estatísticas.' });
  }

  const now = Date.now();
  const entries = Array.from(cache.entries()).map(([key, value]) => ({
    key,
    age: now - value.timestamp,
    dataSize: JSON.stringify(value.data).length
  }));

  res.json({
    cacheSize: cache.size,
    entries,
    user: req.user
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Products Service rodando na porta ${PORT}`);
  console.log(`📝 Endpoints disponíveis:`);
  console.log(`   GET /products - Listar produtos`);
  console.log(`   GET /products/:id - Buscar produto por ID`);
  console.log(`   GET /categories - Listar categorias`);
  console.log(`   GET /products/category/:category - Produtos por categoria`);
  console.log(`   DELETE /cache - Limpar cache (admin)`);
  console.log(`   GET /cache/stats - Estatísticas do cache (admin)`);
  console.log(`   GET /health - Status do serviço`);
});

module.exports = app; 