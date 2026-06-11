# Judge0 CE & Node.js Platform Deployment Guide

This guide describes how to deploy the Judge0 CE system behind the Node.js API, to securely execute untrusted code in Docker sandboxes.

## Architecture

```text
Student Browser (React/Monaco) 
   | (HTTP/REST)
   v
Nginx Reverse Proxy
   |
   v
Node.js API (Backend)
   | (HTTP REST inside internal network)
   v
Judge0 Server
   | (Docker API)
   v
Isolated Sandboxes (Containers for running C++, Python, Java, etc.)
```

## Setup Instructions (Ubuntu Server 22.04)

### 1. Prerequisites

Make sure Docker and Docker Compose are installed on your Ubuntu Server.

```bash
# Install Docker and Docker Compose
sudo apt update
sudo apt install -y docker.io docker-compose
```

### 2. Start Judge0 CE

Judge0 will run securely without exposing itself to the internet. We use the included `docker-compose.yml` and `judge0.conf` files.

1. Navigate to the `deployment/judge0` folder:
   ```bash
   cd deployment/judge0
   ```
2. Pull and start the Judge0 services:
   ```bash
   docker-compose up -d
   ```
3. Verify that Judge0 is running correctly:
   ```bash
   docker ps
   curl http://localhost:2358/about
   ```
   You should see information about the Judge0 system, including version and available languages.

### 3. Start Node.js API

The API should connect to Judge0 internally. If the API is running on the same host, the `JUDGE0_URL` should be `http://localhost:2358`.

```bash
# In your server/.env file, ensure you have:
JUDGE0_URL=http://localhost:2358
```

Then run the Node.js API.

### 4. Reverse Proxy Setup (Nginx)

To serve the React frontend and securely proxy API requests to your Node.js backend:

1. Install Nginx:
   ```bash
   sudo apt install -y nginx
   ```
2. Copy the Nginx configuration:
   ```bash
   sudo cp deployment/nginx.conf /etc/nginx/sites-available/coding-platform
   sudo ln -s /etc/nginx/sites-available/coding-platform /etc/nginx/sites-enabled/
   ```
3. Test and restart Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 5. Sandboxing Security Limits

The sandbox limits are enforced via `deployment/judge0/judge0.conf`:
- **CPU Limit**: 2 seconds (`CPU_TIME_LIMIT=2`)
- **Wall Time Limit**: 5 seconds (`WALL_TIME_LIMIT=5`)
- **Memory Limit**: 256 MB (`MEMORY_LIMIT=262144`)
- **Max File Size**: 10 MB (`MAX_FILE_SIZE=10240`)
- **Processes / Threads**: 64 limit (`MAX_PROCESSES_AND_OR_THREADS=64`)

Judge0 handles network isolation (disabling internet access from executed code) and drops privileges, preventing access to the host's filesystem.

### 6. Health Checks & Monitoring

- You can monitor Judge0 services via Docker logs:
  ```bash
  docker logs -f <judge0-server-container-id>
  docker logs -f <judge0-worker-container-id>
  ```
- The `docker-compose.yml` already includes health checks for the database, redis, and Judge0 server, and restart policies (`restart: always`).
