# Heroku Deployment Guide

## Prerequisites
- Heroku CLI installed
- Git repository
- MongoDB Atlas account

## Steps

### 1. Prepare Backend
```bash
cd backend

# Create Procfile (already created)
echo "web: npm start" > Procfile

# Add start script to package.json (already exists)
npm start
```

### 2. Create Heroku App
```bash
heroku create your-social-network-app
```

### 3. Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
heroku config:set JWT_SECRET=your-secret-key
heroku config:set FRONTEND_URL=https://your-app.herokuapp.com
```

### 4. Deploy
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### 5. Deploy Frontend (Separate App)
```bash
cd ../frontend

# Create separate Heroku app for frontend
heroku create your-social-network-frontend

# Build and deploy
npm run build
git add .
git commit -m "Deploy frontend"
git push heroku main
```

## Important Notes

1. **MongoDB**: Use MongoDB Atlas for production database
2. **File Uploads**: Configure Cloudinary for image storage
3. **Environment**: All secrets must be in Heroku config vars
4. **CORS**: Update FRONTEND_URL to match Heroku domain

## Troubleshooting

### Application Error
```bash
heroku logs --tail
```

### Database Connection
- Verify MongoDB URI
- Check IP whitelist in MongoDB Atlas
- Ensure credentials are correct

### Build Issues
```bash
heroku run npm install
heroku restart
```
