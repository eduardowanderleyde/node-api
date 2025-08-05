const axios = require('axios');

// Base configuration
const API_BASE_URL = 'http://localhost:3000';
let authToken = null;

// Configured Axios client
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Function to perform login
async function login(email, password) {
  try {
    console.log('🔐 Performing login...');
    const response = await apiClient.post('/auth/login', {
      email,
      password
    });
    
    authToken = response.data.token;
    console.log('✅ Login successful!');
    console.log(`👤 User: ${response.data.user.name} (${response.data.user.role})`);
    
    return authToken;
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    throw error;
  }
}

// Função para registrar usuário
async function registerUser(userData) {
  try {
    console.log('📝 Registrando novo usuário...');
    const response = await apiClient.post('/auth/register', userData);
    
    console.log('✅ Usuário registrado com sucesso!');
    console.log(`👤 Usuário: ${response.data.user.name} (${response.data.user.role})`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro no registro:', error.response?.data || error.message);
    throw error;
  }
}

// Função para verificar token
async function verifyToken() {
  if (!authToken) {
    console.log('⚠️  Nenhum token disponível');
    return false;
  }

  try {
    console.log('🔍 Verificando token...');
    const response = await apiClient.get('/auth/verify', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Token válido!');
    return true;
  } catch (error) {
    console.error('❌ Token inválido:', error.response?.data || error.message);
    return false;
  }
}

// Função para obter perfil do usuário
async function getProfile() {
  if (!authToken) {
    console.log('⚠️  Nenhum token disponível');
    return null;
  }

  try {
    console.log('👤 Obtendo perfil do usuário...');
    const response = await apiClient.get('/auth/profile', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Perfil obtido com sucesso!');
    console.log(`👤 Nome: ${response.data.user.name}`);
    console.log(`📧 Email: ${response.data.user.email}`);
    console.log(`🔑 Role: ${response.data.user.role}`);
    
    return response.data.user;
  } catch (error) {
    console.error('❌ Erro ao obter perfil:', error.response?.data || error.message);
    throw error;
  }
}

// Função para listar produtos
async function getProducts(limit = 10, sort = 'desc') {
  if (!authToken) {
    console.log('⚠️  Nenhum token disponível');
    return null;
  }

  try {
    console.log('🛍️  Buscando produtos...');
    const response = await apiClient.get(`/products?limit=${limit}&sort=${sort}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ ${response.data.total} produtos encontrados!`);
    console.log(`💾 Cache: ${response.data.cached ? 'Sim' : 'Não'}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error.response?.data || error.message);
    throw error;
  }
}

// Função para buscar produto por ID
async function getProductById(id) {
  if (!authToken) {
    console.log('⚠️  Nenhum token disponível');
    return null;
  }

  try {
    console.log(`🔍 Buscando produto ID: ${id}...`);
    const response = await apiClient.get(`/products/${id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Produto encontrado!');
    console.log(`📦 Nome: ${response.data.data.title}`);
    console.log(`💰 Preço: $${response.data.data.price} (R$ ${response.data.data.priceInBRL})`);
    console.log(`🏷️  Categoria: ${response.data.data.category}`);
    console.log(`💾 Cache: ${response.data.cached ? 'Sim' : 'Não'}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Erro ao buscar produto:', error.response?.data || error.message);
    throw error;
  }
}

// Função para listar categorias
async function getCategories() {
  if (!authToken) {
    console.log('⚠️  Nenhum token disponível');
    return null;
  }

  try {
    console.log('📂 Buscando categorias...');
    const response = await apiClient.get('/categories', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ ${response.data.total} categorias encontradas!`);
    console.log(`💾 Cache: ${response.data.cached ? 'Sim' : 'Não'}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Erro ao buscar categorias:', error.response?.data || error.message);
    throw error;
  }
}

// Função para buscar produtos por categoria
async function getProductsByCategory(category, limit = 10) {
  if (!authToken) {
    console.log('⚠️  Nenhum token disponível');
    return null;
  }

  try {
    console.log(`🛍️  Buscando produtos da categoria: ${category}...`);
    const response = await apiClient.get(`/products/category/${category}?limit=${limit}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ ${response.data.total} produtos encontrados na categoria ${category}!`);
    console.log(`💾 Cache: ${response.data.cached ? 'Sim' : 'Não'}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Erro ao buscar produtos da categoria:', error.response?.data || error.message);
    throw error;
  }
}

// Função para limpar cache (apenas admin)
async function clearCache() {
  if (!authToken) {
    console.log('⚠️  Nenhum token disponível');
    return null;
  }

  try {
    console.log('🧹 Limpando cache...');
    const response = await apiClient.delete('/admin/cache', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Cache limpo com sucesso!');
    console.log(`🗑️  Entradas removidas: ${response.data.clearedEntries}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error.response?.data || error.message);
    throw error;
  }
}

// Função para obter estatísticas do cache (apenas admin)
async function getCacheStats() {
  if (!authToken) {
    console.log('⚠️  Nenhum token disponível');
    return null;
  }

  try {
    console.log('📊 Obtendo estatísticas do cache...');
    const response = await apiClient.get('/admin/cache/stats', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Estatísticas obtidas!');
    console.log(`📦 Tamanho do cache: ${response.data.cacheSize} entradas`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error.response?.data || error.message);
    throw error;
  }
}

// Função para verificar status dos serviços
async function checkHealth() {
  try {
    console.log('🏥 Verificando saúde dos serviços...');
    const response = await apiClient.get('/health');
    
    console.log('✅ Status dos serviços:');
    console.log(`🌐 Gateway: ${response.data.gateway}`);
    console.log(`🔐 Auth Service: ${response.data.services.auth?.status || 'ERROR'}`);
    console.log(`🛍️  Products Service: ${response.data.services.products?.status || 'ERROR'}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao verificar saúde:', error.response?.data || error.message);
    throw error;
  }
}

// Função para obter documentação da API
async function getApiDocs() {
  try {
    console.log('📚 Obtendo documentação da API...');
    const response = await apiClient.get('/api-docs');
    
    console.log('✅ Documentação obtida!');
    console.log(`📋 Versão: ${response.data.version}`);
    console.log(`📝 Endpoints disponíveis: ${Object.keys(response.data.endpoints).length} categorias`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao obter documentação:', error.response?.data || error.message);
    throw error;
  }
}

// Exemplo de uso completo
async function runExample() {
  console.log('🚀 Iniciando exemplo de uso da API...\n');

  try {
    // 1. Verificar saúde dos serviços
    await checkHealth();
    console.log('');

    // 2. Obter documentação
    await getApiDocs();
    console.log('');

    // 3. Fazer login com usuário comum
    await login('user@exemplo.com', 'password');
    console.log('');

    // 4. Verificar token
    await verifyToken();
    console.log('');

    // 5. Obter perfil
    await getProfile();
    console.log('');

    // 6. Listar categorias
    const categories = await getCategories();
    console.log('📂 Categorias disponíveis:');
    categories.forEach(cat => console.log(`   - ${cat.name} (${cat.productCount} produtos)`));
    console.log('');

    // 7. Listar produtos
    const products = await getProducts(5, 'desc');
    console.log('🛍️  Primeiros 5 produtos:');
    products.forEach(product => {
      console.log(`   - ${product.title} ($${product.price})`);
    });
    console.log('');

    // 8. Buscar produto específico
    await getProductById(1);
    console.log('');

    // 9. Buscar produtos por categoria
    await getProductsByCategory('electronics', 3);
    console.log('');

    // 10. Fazer login como admin
    await login('admin@exemplo.com', 'password');
    console.log('');

    // 11. Obter estatísticas do cache
    await getCacheStats();
    console.log('');

    // 12. Limpar cache
    await clearCache();
    console.log('');

    console.log('✅ Exemplo concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no exemplo:', error.message);
  }
}

// Exportar funções para uso em outros arquivos
module.exports = {
  login,
  registerUser,
  verifyToken,
  getProfile,
  getProducts,
  getProductById,
  getCategories,
  getProductsByCategory,
  clearCache,
  getCacheStats,
  checkHealth,
  getApiDocs,
  runExample
};

// Executar exemplo se o arquivo for executado diretamente
if (require.main === module) {
  runExample();
} 