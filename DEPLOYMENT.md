# Guide de Déploiement - Projet Réseau Social

## 📋 Prérequis

- Node.js 18+ 
- MongoDB (local ou cloud)
- Git
- Compte sur plateforme de déploiement (Vercel, Heroku, etc.)

## 🚀 Options de Déploiement

### 1. **Vercel (Recommandé pour débutants)**

#### Backend (API Serverless)
```bash
# Installer Vercel CLI
npm i -g vercel

# Dans le dossier backend
cd backend
vercel --prod
```

#### Frontend
```bash
# Dans le dossier frontend
cd frontend
vercel --prod
```

### 2. **Heroku**

#### Préparation
```bash
# Créer Procfile dans backend
echo "web: npm start" > backend/Procfile

# Créer .env.example
cat > backend/.env.example << EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=votre_secret_jwt
FRONTEND_URL=https://votre-domaine.vercel.app
EOF
```

#### Déploiement
```bash
# Installer Heroku CLI
# Créer app Heroku
heroku create votre-app

# Déployer backend
cd backend
heroku git:remote -a votre-app
git add .
git commit -m "Deploy backend"
git push heroku main

# Configurer variables d'environnement
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=votre_uri_mongodb
heroku config:set JWT_SECRET=votre_secret
```

### 3. **DigitalOcean App Platform**

#### Créer app.yaml
```yaml
name: social-network-app
services:
- name: backend
  source_dir: backend
  build_command: npm install
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: 5000
  http_port: 5000
  routes:
  - path: /api
- name: frontend
  source_dir: frontend
  build_command: npm run build
  run_command: npm run preview
  environment_slug: node-js
  http_port: 4173
  routes:
  - path: /
```

### 4. **Docker (Production)**

#### Créer Dockerfile pour backend
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

#### Créer Dockerfile pour frontend
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

#### docker-compose.yml
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
    depends_on:
      - mongo

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 🔧 Étapes Communes

### 1. **Préparer le projet**

```bash
# Build du frontend
cd frontend
npm run build

# Nettoyer les dépendances dev
cd ../backend
npm prune --production
```

### 2. **Variables d'environnement**

Créez `.env` avec :
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=votre_uri_mongodb
JWT_SECRET=votre_secret_tres_securise
FRONTEND_URL=https://votre-domaine.com
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_app
```

### 3. **Base de données**

#### MongoDB Atlas (Recommandé)
1. Créez un compte sur [MongoDB Atlas](https://cloud.mongodb.com)
2. Créez un cluster gratuit
3. Obtenez votre URI de connexion
4. Configurez les IP autorisées (0.0.0.0/0 pour tout)

#### Alternatives
- DigitalOcean Managed Database
- AWS DocumentDB
- Azure Cosmos DB

### 4. **Stockage des fichiers**

#### Cloudinary (Déjà configuré)
1. Créez un compte [Cloudinary](https://cloudinary.com)
2. Obtenez vos credentials
3. Ajoutez-les aux variables d'environnement

#### Alternatives
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Blob Storage

## 🌐 Déploiement par Plateforme

### Vercel (Plus Simple)

#### Backend
```bash
cd backend
# Installer vercel
npm i -g vercel

# Déployer
vercel --prod
```

#### Frontend  
```bash
cd frontend
vercel --prod
```

### Heroku

```bash
# Installer Heroku CLI
# Se connecter
heroku login

# Créer app
heroku create votre-app

# Déployer
git add .
git commit -m "Deploy"
git push heroku main
```

### Railway

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Déployer
railway up
```

## 🔍 Tests Post-Déploiement

### 1. **API Health Check**
```bash
curl https://votre-api.com/api/health
```

### 2. **Frontend Access**
```bash
# Vérifier que le frontend charge
curl https://votre-domaine.com
```

### 3. **Database Connection**
```bash
# Tester l'endpoint d'inscription
curl -X POST https://votre-api.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

## 📊 Monitoring

### 1. **Logs**
- Vercel: `vercel logs`
- Heroku: `heroku logs --tail`
- Railway: Dashboard logs

### 2. **Performance**
- [Vercel Analytics](https://vercel.com/analytics)
- [Heroku Metrics](https://devcenter.heroku.com/articles/metrics)
- [Google Analytics](https://analytics.google.com)

### 3. **Uptime**
- [UptimeRobot](https://uptimerobot.com) (gratuit)
- [Pingdom](https://pingdom.com)

## 🚨 Sécurité

### 1. **HTTPS**
- Activé automatiquement sur Vercel/Heroku
- Certificat SSL gratuit

### 2. **Environment Variables**
- Jamais exposer les secrets
- Utiliser `.env` en production

### 3. **Rate Limiting**
- Déjà configuré avec `express-rate-limit`

### 4. **CORS**
- Configuré pour votre domaine frontend

## 🔄 CI/CD (Optionnel)

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 💰 Coûts Estimés

### Gratuit
- Vercel: Frontend + Backend (limites généreuses)
- MongoDB Atlas: 512MB
- Cloudinary: 25 crédits/mois

### Payant (si besoin de scaling)
- Vercel Pro: $20/mois
- MongoDB Atlas: $9/mois (1GB)
- Cloudinary: $89/mois

## 🎯 Recommandation

**Pour commencer**: Vercel + MongoDB Atlas (gratuit)
**Pour production**: Vercel Pro + MongoDB Atlas M0 + Cloudinary

---

## 📞 Support

En cas de problème :
1. Vérifiez les logs
2. Testez localement
3. Contactez-moi pour plus d'aide
