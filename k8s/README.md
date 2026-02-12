# Kubernetes Deployment for MCP Servers

This directory contains Kubernetes manifests to deploy all three MCP servers (Weather, Metrics, Support) in a single pod with both SSE and HTTP transports accessible.

## Architecture

- **Single Pod Deployment**: All three MCP servers run as containers in one pod
- **Dual Transport**: Each server exposes both SSE and HTTP ports
- **Cross-Namespace Access**: NetworkPolicy allows access from any namespace
- **Resource Efficient**: Optimized for sample/demo usage with low traffic

## Port Mapping

| Server | SSE Port | HTTP Port | Authentication |
|--------|----------|-----------|----------------|
| Weather MCP | 3000 | 3001 | None |
| Metrics MCP | 4000 | 4001 | API Key |
| Support MCP | 5000 | 5001 | Basic Auth |

## Prerequisites

1. Kubernetes cluster with `mcp-servers` namespace already created
2. Docker installed for building images
3. `kubectl` configured to access your cluster

## Build Docker Images

Build each MCP server image locally:

```bash
# Build Weather MCP
cd weather-mcp
docker build -t weather-mcp:latest .

# Build Metrics MCP
cd ../metrics-mcp
docker build -t metrics-mcp:latest .

# Build Support MCP
cd ../support-mcp
docker build -t support-mcp:latest .

cd ..
```

## Using Local Docker Images in Kubernetes

### Option 1: Kind Cluster (Recommended for local development)

If using Kind, load images directly:

```bash
kind load docker-image weather-mcp:latest
kind load docker-image metrics-mcp:latest
kind load docker-image support-mcp:latest
```

### Option 2: Minikube

If using Minikube, use the Minikube Docker daemon:

```bash
eval $(minikube docker-env)

# Then rebuild images in Minikube's Docker
cd weather-mcp && docker build -t weather-mcp:latest . && cd ..
cd metrics-mcp && docker build -t metrics-mcp:latest . && cd ..
cd support-mcp && docker build -t support-mcp:latest . && cd ..
```

### Option 3: k3s/k3d

For k3d, import images:

```bash
k3d image import weather-mcp:latest -c your-cluster-name
k3d image import metrics-mcp:latest -c your-cluster-name
k3d image import support-mcp:latest -c your-cluster-name
```

### Option 4: Docker Desktop Kubernetes

Docker Desktop Kubernetes uses your local Docker images directly. No additional steps needed - just ensure `imagePullPolicy: IfNotPresent` or `Never` is set (already configured).

### Option 5: Remote Cluster (requires registry)

For remote clusters, you need a container registry:

```bash
# Tag images with your registry
docker tag weather-mcp:latest your-registry/weather-mcp:latest
docker tag metrics-mcp:latest your-registry/metrics-mcp:latest
docker tag support-mcp:latest your-registry/support-mcp:latest

# Push to registry
docker push your-registry/weather-mcp:latest
docker push your-registry/metrics-mcp:latest
docker push your-registry/support-mcp:latest
```

Then update image names in `k8s/mcp-servers-deployment.yaml`:
```yaml
image: your-registry/weather-mcp:latest
image: your-registry/metrics-mcp:latest
image: your-registry/support-mcp:latest
```

## Deploy to Kubernetes

Apply the deployment manifest:

```bash
kubectl apply -f k8s/mcp-servers-deployment.yaml
```

This will create:
- ✅ Deployment with 3 containers (weather-mcp, metrics-mcp, support-mcp)
- ✅ Service exposing all 6 ports (3 SSE + 3 HTTP)
- ✅ NetworkPolicy allowing cross-namespace access

## Verify Deployment

Check if the pod is running:

```bash
kubectl get pods -n mcp-servers -l app=mcp-servers
```

Check service endpoints:

```bash
kubectl get svc -n mcp-servers mcp-servers
```

View pod logs:

```bash
# All containers
kubectl logs -n mcp-servers -l app=mcp-servers --all-containers=true

# Specific container
kubectl logs -n mcp-servers -l app=mcp-servers -c weather-mcp
kubectl logs -n mcp-servers -l app=mcp-servers -c metrics-mcp
kubectl logs -n mcp-servers -l app=mcp-servers -c support-mcp
```

## Access from Different Namespace

### DNS Names

From any namespace, use the fully qualified service name:

```
mcp-servers.mcp-servers.svc.cluster.local
```

Or the shorter form (usually works):

```
mcp-servers.mcp-servers
```

### Test Access

Deploy a test pod in your application namespace:

```bash
kubectl run test-client -n your-namespace --image=curlimages/curl -it --rm -- sh
```

Inside the test pod:

```bash
# Test Weather MCP (No Auth) - HTTP endpoint
curl -X POST http://mcp-servers.mcp-servers:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_current_weather",
      "arguments": {"location": "Tokyo"}
    }
  }'

# Test Metrics MCP (API Key Auth) - HTTP endpoint
curl -X POST http://mcp-servers.mcp-servers:4001/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mh_viewer_demo123" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_metrics",
      "arguments": {"metricId": "revenue_mrr"}
    }
  }'

# Test Support MCP (Basic Auth) - HTTP endpoint
curl -u agent1:pass123 -X POST http://mcp-servers.mcp-servers:5001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_tickets",
      "arguments": {}
    }
  }'
```

## Service Endpoints Summary

### From Any Namespace

**Weather MCP:**
- SSE: `http://mcp-servers.mcp-servers:3000/sse`
- HTTP: `http://mcp-servers.mcp-servers:3001/mcp`

**Metrics MCP:**
- SSE: `http://mcp-servers.mcp-servers:4000/sse` (requires `X-API-Key` header)
- HTTP: `http://mcp-servers.mcp-servers:4001/mcp` (requires `X-API-Key` header)

**Support MCP:**
- SSE: `http://mcp-servers.mcp-servers:5000/sse` (requires Basic Auth)
- HTTP: `http://mcp-servers.mcp-servers:5001/mcp` (requires Basic Auth)

## Authentication Credentials

### Metrics MCP (API Key)
```
Viewer:  mh_viewer_demo123  (read-only)
Analyst: mh_analyst_demo456 (read+write)
Admin:   mh_admin_demo789   (full access)
```

### Support MCP (Basic Auth)
```
Agent:      agent1 / pass123       (basic support)
Supervisor: supervisor1 / super123 (+ assignment, stats)
Admin:      admin / admin123       (full access)
```

## Troubleshooting

### ImagePullBackOff Error

If you see `ImagePullBackOff`:

```bash
kubectl describe pod -n mcp-servers -l app=mcp-servers
```

This usually means:
1. **Image not available locally** - Rebuild images or load them into cluster
2. **Wrong imagePullPolicy** - Should be `IfNotPresent` or `Never` for local images (already set)

**Fix for Kind:**
```bash
kind load docker-image weather-mcp:latest
kind load docker-image metrics-mcp:latest
kind load docker-image support-mcp:latest
kubectl rollout restart deployment/mcp-servers -n mcp-servers
```

**Fix for Minikube:**
```bash
eval $(minikube docker-env)
# Rebuild images
kubectl rollout restart deployment/mcp-servers -n mcp-servers
```

### Pod not starting
```bash
kubectl describe pod -n mcp-servers -l app=mcp-servers
kubectl logs -n mcp-servers -l app=mcp-servers --all-containers=true
```

### Cannot access from another namespace
```bash
# Check if service exists
kubectl get svc -n mcp-servers mcp-servers

# Test DNS resolution
kubectl run test-dns -n your-namespace --image=busybox -it --rm -- \
  nslookup mcp-servers.mcp-servers.svc.cluster.local
```

## Update Deployment

To update after code changes:

```bash
# Rebuild images
cd weather-mcp && docker build -t weather-mcp:latest . && cd ..
cd metrics-mcp && docker build -t metrics-mcp:latest . && cd ..
cd support-mcp && docker build -t support-mcp:latest . && cd ..

# For Kind - reload images
kind load docker-image weather-mcp:latest
kind load docker-image metrics-mcp:latest
kind load docker-image support-mcp:latest

# Restart deployment
kubectl rollout restart deployment/mcp-servers -n mcp-servers

# Watch rollout status
kubectl rollout status deployment/mcp-servers -n mcp-servers
```

## Delete Deployment

To remove the deployment (keeps namespace and other resources):

```bash
kubectl delete -f k8s/mcp-servers-deployment.yaml
```

## Resource Usage

Expected resource usage for all three servers:

- **Memory**: ~384Mi (128Mi request × 3 containers)
- **CPU**: ~300m (100m request × 3 containers)
- **Disk**: Minimal (Node.js runtime + dependencies)

## Quick Start Guide

```bash
# 1. Build images
cd weather-mcp && docker build -t weather-mcp:latest . && cd ..
cd metrics-mcp && docker build -t metrics-mcp:latest . && cd ..
cd support-mcp && docker build -t support-mcp:latest . && cd ..

# 2. Load into cluster (if using Kind)
kind load docker-image weather-mcp:latest
kind load docker-image metrics-mcp:latest
kind load docker-image support-mcp:latest

# 3. Deploy
kubectl apply -f k8s/mcp-servers-deployment.yaml

# 4. Verify
kubectl get pods -n mcp-servers -l app=mcp-servers
kubectl get svc -n mcp-servers mcp-servers

# 5. Test from another namespace
kubectl run test-client -n your-namespace --image=curlimages/curl -it --rm -- \
  curl -X POST http://mcp-servers.mcp-servers:3001/mcp \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Kubernetes Namespace: mcp-servers                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Pod: mcp-servers                                    │   │
│  │                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │   │
│  │  │ weather-mcp  │  │ metrics-mcp  │  │ support  │ │   │
│  │  │              │  │              │  │   -mcp   │ │   │
│  │  │ :3000 SSE    │  │ :4000 SSE    │  │ :5000    │ │   │
│  │  │ :3001 HTTP   │  │ :4001 HTTP   │  │  SSE     │ │   │
│  │  │              │  │              │  │ :5001    │ │   │
│  │  │ No Auth      │  │ API Key Auth │  │  HTTP    │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ▲                                 │
│  ┌────────────────────────┴────────────────────────────┐   │
│  │ Service: mcp-servers (ClusterIP)                    │   │
│  │ Ports: 3000,3001,4000,4001,5000,5001                │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┼─────────────────────────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         │                                     │
    ┌────┴──────┐                      ┌──────┴─────┐
    │ Namespace │                      │ Namespace  │
    │  app-1    │                      │   app-2    │
    │  (Access) │                      │  (Access)  │
    └───────────┘                      └────────────┘
```

## Support

For issues or questions about the MCP servers themselves, see:
- [Weather MCP README](../weather-mcp/README.md)
- [Metrics MCP README](../metrics-mcp/README.md)
- [Support MCP README](../support-mcp/README.md)
