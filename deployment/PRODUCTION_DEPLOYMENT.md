# Production Deployment Guide

This guide provides step-by-step instructions to deploy the Coding Assessment Platform to a production server (e.g., Ubuntu Server 22.04 LTS).

---

## System Architecture Overview

In a production environment, the services interact as follows:

```text
                  ┌──────────────────────────────────────────┐
                  │              User Browser                │
                  └────────────────────┬─────────────────────┘
                                       │
                                       │ HTTP/HTTPS (Ports 80/443)
                                       v
                  ┌──────────────────────────────────────────┐
                  │           Nginx Reverse Proxy            │
                  └────────────┬────────────────────┬────────┘
                               │                    │
            Static Files (web) │                    │ /api/* (API proxy)
                               v                    v
                  ┌───────────────────┐    ┌─────────────────┐
                  │ Client Container  │    │Server Container │
                  │     (Port 80)     │    │   (Port 5000)   │
                  └───────────────────┘    └────────┬────────┘
                                                    │
                               ┌────────────────────┴────────┐
                               │                             │
                               v                             v
                  ┌───────────────────┐            ┌───────────────────┐
                  │ MongoDB Database  │            │  Judge0 Server    │
                  │   (Port 27017)    │            │    (Port 2358)    │
                  └───────────────────┘            └────┬────────┬─────┘
                                                        │        │
                                                        v        v
                                                   ┌─────────┐ ┌─────────┐
                                                   │ Worker  │ │ Redis   │
                                                   └─────────┘ └─────────┘
                                                        │
                                                        v
                                                   ┌─────────┐
                                                   │Postgres │
                                                   └─────────┘
```

* **Frontend (Client)**: Built static files served via Nginx inside Docker.
* **Backend (Server)**: Node.js Express server handling API requests, auth, and managing submissions.
* **Database (MongoDB)**: Stores users, assessments, questions, submissions, and logs.
* **Sandbox Engine (Judge0)**: Runs code submissions safely in isolated micro-containers, communicating internally with Redis and PostgreSQL.

---

## Prerequisites

Ensure your target server has the following installed:

1. **Docker Engine** (version 20.10+)
2. **Docker Compose** (version v2+)
3. **Nginx** (acting as host reverse proxy and SSL terminator)
4. **Git** (to pull codebase changes)

To install Docker and Docker Compose on Ubuntu:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 nginx git certbot python3-certbot-nginx
```

---

## Step 1: Clone and Prepare Files

1. Clone the project repository onto the server:
   ```bash
   git clone <your-repository-url> /opt/coding-platform
   cd /opt/coding-platform
   ```

2. Create a production `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

3. Open `.env` and configure production variables:
   ```bash
   nano .env
   ```

   Ensure you update the following fields:
   * `NODE_ENV=production`
   * `JWT_SECRET` (Generate a secure key using `openssl rand -hex 32`)
   * `OPENAI_API_KEY` (Your OpenAI API token for the AI Mentor)
   * `CLIENT_ORIGIN` (Your public domain, e.g., `https://assessments.yourdomain.com`)
   * `ADMIN_EMAIL` (Production administrator email)
   * `ADMIN_PASSWORD` (Change from default to a strong password)

---

## Step 2: Deployment Orchestration

There are two patterns for running the stack. **Option A (Unified Compose)** is highly recommended because Docker routes services using internal DNS, keeping Judge0 hidden from the public web.

### Option A: Unified Docker Compose (Recommended)

Merge the application and Judge0 into a single deployment manifest. Create a file called `docker-compose.prod.yml` in the root:

```yaml
version: '3.8'

services:
  # 1. MongoDB Database
  mongo:
    image: mongo:7
    restart: unless-stopped
    volumes:
      - mongo_data:/data/db
    networks:
      - platform-network

  # 2. Node.js Backend API
  server:
    build:
      context: ./server
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/coding_assessment
      - CLIENT_ORIGIN=${CLIENT_ORIGIN:-http://localhost:8080}
      - PORT=5000
      - JUDGE0_URL=http://judge0-server:2358
    ports:
      - "5000:5000"
    depends_on:
      - mongo
      - judge0-server
    networks:
      - platform-network

  # 3. Client Frontend
  client:
    build:
      context: ./client
      args:
        VITE_API_URL: /api
    restart: unless-stopped
    ports:
      - "8080:80"
    depends_on:
      - server
    networks:
      - platform-network

  # 4. Judge0 Server
  judge0-server:
    image: judge0/judge0:1.13.1
    volumes:
      - ./deployment/judge0/judge0.conf:/judge0.conf:ro
    privileged: true
    restart: always
    depends_on:
      judge0-db:
        condition: service_healthy
      judge0-redis:
        condition: service_healthy
    networks:
      - platform-network

  # 5. Judge0 Worker
  judge0-worker:
    image: judge0/judge0:1.13.1
    command: ["./scripts/workers"]
    volumes:
      - ./deployment/judge0/judge0.conf:/judge0.conf:ro
    privileged: true
    restart: always
    depends_on:
      judge0-db:
        condition: service_healthy
      judge0-redis:
        condition: service_healthy
    networks:
      - platform-network

  # 6. Judge0 PostgreSQL Database
  judge0-db:
    image: postgres:13.0
    env_file: ./deployment/judge0/judge0.conf
    volumes:
      - postgres-data:/var/lib/postgresql/data/
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - platform-network

  # 7. Judge0 Redis Cache
  judge0-redis:
    image: redis:6.0
    command: [
      "bash", "-c",
      'docker-entrypoint.sh --appendonly yes --requirepass "$$REDIS_PASSWORD"'
    ]
    env_file: ./deployment/judge0/judge0.conf
    volumes:
      - redis-data:/data
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - platform-network

volumes:
  mongo_data:
  postgres-data:
  redis-data:

networks:
  platform-network:
    driver: bridge
```

Start the entire environment:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

### Option B: Running Separate Stacks

If you prefer to keep deployments decoupled, run Judge0 independently from the app.

> [!WARNING]
> Inside docker containers, `localhost` points to the container itself. If they run on separate docker networks, the `server` container must use the server host's primary IP or the Docker Gateway IP (typically `172.17.0.1` or `172.18.0.1`) rather than `localhost` or `127.0.0.1`.

#### Step 2.1: Spin up Judge0 CE
1. Navigate to the Judge0 folder:
   ```bash
   cd /opt/coding-platform/deployment/judge0
   ```
2. Start the database, cache, server, and worker:
   ```bash
   docker compose up -d
   ```

#### Step 2.2: Spin up App Containers
1. Go back to root directory and configure `.env`:
   ```bash
   cd /opt/coding-platform
   # Inside .env, configure JUDGE0_URL to target host's Docker Gateway
   # e.g., JUDGE0_URL=http://172.17.0.1:2358
   ```
2. Start the primary app:
   ```bash
   docker compose up -d --build
   ```

---

## Step 3: Seed the Database

Once the database and server are healthy, run the seed command inside the running backend container to generate demo assessments and the initial admin user.

1. Find the name or ID of the running server container:
   ```bash
   docker ps | grep server
   ```
2. Execute the seeding script:
   ```bash
   docker exec -it <container_id_or_name> npm run seed
   ```

---

## Step 4: Configure Nginx & SSL (HTTPS)

Secure the connection to the frontend and protect the data submitted by users.

1. Disable default Nginx server:
   ```bash
   sudo rm /etc/nginx/sites-enabled/default
   ```

2. Create a new site configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/coding-platform
   ```

3. Paste the following configuration, replacing `yourdomain.com` with your active domain:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Certbot SSL validation path
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all HTTP traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates will be updated here by Certbot
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;

    # Frontend Client
    location / {
        proxy_pass http://localhost:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API Server
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

4. Enable the configuration and test Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/coding-platform /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. Acquire SSL certificates using Certbot:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```
   Certbot will automatically modify your `/etc/nginx/sites-available/coding-platform` to link the SSL certificates and configure auto-renewals.

---

## Step 5: Verification & Verification Commands

1. **Verify all services are up**:
   ```bash
   docker ps
   ```
   You should see 7 running containers (client, server, mongo, judge0-server, judge0-worker, judge0-db, judge0-redis).

2. **Test backend health check**:
   ```bash
   curl http://localhost:5000/api/health
   ```

3. **Check Judge0 Status internally**:
   ```bash
   curl http://localhost:2358/about
   ```

4. **Verify container logs**:
   ```bash
   docker compose -f docker-compose.prod.yml logs -f server
   docker compose -f docker-compose.prod.yml logs -f judge0-worker
   ```
