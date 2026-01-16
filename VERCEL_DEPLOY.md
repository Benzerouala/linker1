# Vercel Deployment Configuration

## Backend Configuration

### vercel.json (backend)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Steps to Deploy

#### 1. Install Vercel CLI
```bash
npm i -g vercel
```

#### 2. Deploy Backend
```bash
cd backend
vercel --prod
```

#### 3. Deploy Frontend
```bash
cd frontend
vercel --prod
```

#### 4. Configure Environment Variables
```bash
# In Vercel dashboard or CLI
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add FRONTEND_URL
```

## Frontend Configuration

### vite.config.js (if needed)
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://your-backend.vercel.app',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})
```

## Post-Deployment

1. Update API URLs in frontend
2. Test all endpoints
3. Verify database connection
4. Check file uploads
