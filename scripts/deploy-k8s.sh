#!/bin/bash

# Kubernetes deployment script for Enterprise Microservices Platform
# Developed by Wander

set -e

echo "🚀 Deploying Enterprise Microservices Platform to Kubernetes..."

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if we're connected to a cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Not connected to a Kubernetes cluster. Please connect to a cluster first."
    exit 1
fi

echo "✅ Connected to Kubernetes cluster: $(kubectl config current-context)"

# Create namespace
echo "📦 Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Apply ConfigMap and Secrets
echo "🔧 Applying ConfigMap and Secrets..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Build and push Docker image (if needed)
echo "🐳 Building Docker image..."
docker build -t enterprise-microservices:latest .

# Deploy services
echo "🚀 Deploying services..."

# Deploy Auth Service
echo "🔐 Deploying Auth Service..."
kubectl apply -f k8s/auth-service.yaml

# Deploy Products Service
echo "🛍️  Deploying Products Service..."
kubectl apply -f k8s/products-service.yaml

# Deploy API Gateway
echo "🌐 Deploying API Gateway..."
kubectl apply -f k8s/gateway.yaml

# Deploy Ingress
echo "🔗 Deploying Ingress..."
kubectl apply -f k8s/ingress.yaml

# Deploy HPA
echo "📈 Deploying Horizontal Pod Autoscalers..."
kubectl apply -f k8s/hpa.yaml

# Wait for deployments to be ready
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/auth-service -n microservices-platform
kubectl wait --for=condition=available --timeout=300s deployment/products-service -n microservices-platform
kubectl wait --for=condition=available --timeout=300s deployment/api-gateway -n microservices-platform

echo "✅ Deployment completed successfully!"

# Show status
echo ""
echo "📊 Deployment Status:"
echo "====================="
kubectl get pods -n microservices-platform
echo ""
echo "🔗 Services:"
kubectl get services -n microservices-platform
echo ""
echo "🌐 Ingress:"
kubectl get ingress -n microservices-platform

echo ""
echo "🎉 Enterprise Microservices Platform is now running on Kubernetes!"
echo ""
echo "📝 Access URLs:"
echo "   API Gateway: http://api.enterprise.com"
echo "   Auth Service: http://auth.enterprise.com"
echo "   Products Service: http://products.enterprise.com"
echo ""
echo "💡 To check logs:"
echo "   kubectl logs -f deployment/api-gateway -n microservices-platform"
echo "   kubectl logs -f deployment/auth-service -n microservices-platform"
echo "   kubectl logs -f deployment/products-service -n microservices-platform" 