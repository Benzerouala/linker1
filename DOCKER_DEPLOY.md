# Docker Deployment

## Backend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p src/uploads

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

## Frontend Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

## nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api {
            proxy_pass http://backend:5000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

## docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/social-network
      - JWT_SECRET=your-secret-key
    volumes:
      - ./backend/src/uploads:/app/src/uploads
    depends_on:
      - mongo
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    restart: unless-stopped

volumes:
  mongo_data:
```

## Deployment Steps

### 1. Build and Run
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 2. Production Deployment
```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Backup Database
```bash
# Backup MongoDB
docker exec mongo mongodump --out /backup

# Copy backup locally
docker cp mongo:/backup ./backup
```

## Environment Variables

Create `.env` file:
```env
NODE_ENV=production
MONGODB_URI=mongodb://mongo:27017/social-network
JWT_SECRET=your-production-secret
FRONTEND_URL=http://localhost
```

## Monitoring

### Health Check
```bash
# Check backend health
curl http://localhost:5000/api/health

# Check frontend
curl http://localhost
```

### Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongo
```
