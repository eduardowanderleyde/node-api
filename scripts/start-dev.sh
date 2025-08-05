#!/bin/bash

# Script to start all services in development mode
# Developed by Wander
echo "🚀 Starting microservices in development mode..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js primeiro."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Instale o npm primeiro."
    exit 1
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cp env.example .env
    echo "✅ Arquivo .env criado. Configure as variáveis conforme necessário."
fi

# Função para verificar se uma porta está em uso
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Porta $1 já está em uso. Parando processo..."
        lsof -ti:$1 | xargs kill -9
        sleep 2
    fi
}

# Verificar e liberar portas se necessário
echo "🔍 Verificando portas..."
check_port 3000
check_port 3001
check_port 3002

# Iniciar Auth Service
echo "🔐 Iniciando Auth Service na porta 3001..."
node services/auth-service/index.js &
AUTH_PID=$!

# Aguardar um pouco para o Auth Service inicializar
sleep 3

# Iniciar Products Service
echo "🛍️  Iniciando Products Service na porta 3002..."
node services/products-service/index.js &
PRODUCTS_PID=$!

# Aguardar um pouco para o Products Service inicializar
sleep 3

# Iniciar Gateway
echo "🌐 Iniciando API Gateway na porta 3000..."
node index.js &
GATEWAY_PID=$!

# Função para limpar processos ao sair
cleanup() {
    echo "🛑 Parando todos os serviços..."
    kill $AUTH_PID 2>/dev/null
    kill $PRODUCTS_PID 2>/dev/null
    kill $GATEWAY_PID 2>/dev/null
    exit 0
}

# Capturar Ctrl+C para limpar processos
trap cleanup SIGINT

echo ""
echo "✅ Todos os serviços iniciados!"
echo ""
echo "🔗 URLs dos serviços:"
echo "   🌐 API Gateway: http://localhost:3000"
echo "   🔐 Auth Service: http://localhost:3001"
echo "   🛍️  Products Service: http://localhost:3002"
echo ""
echo "📝 Endpoints principais:"
echo "   GET  http://localhost:3000/health - Status dos serviços"
echo "   GET  http://localhost:3000/api-docs - Documentação da API"
echo "   POST http://localhost:3000/auth/login - Fazer login"
echo "   GET  http://localhost:3000/products - Listar produtos (requer auth)"
echo ""
echo "👥 Usuários de teste:"
echo "   Admin: admin@exemplo.com / password"
echo "   User:  user@exemplo.com / password"
echo ""
echo "💡 Pressione Ctrl+C para parar todos os serviços"
echo ""

# Aguardar indefinidamente
wait 