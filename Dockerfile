# ==========================================
# Stage 1: Build Frontend
# ==========================================
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source
COPY frontend/ .

# Build frontend (accepting build args if needed)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ==========================================
# Stage 2: Setup Backend & Serve
# ==========================================
FROM node:18-alpine
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./
RUN npm install --production

# Copy backend source
COPY backend/ .

# Copy built frontend assets to backend's public/static folder
# Assuming backend serves static files from 'public' or similar
# If not, we might need to adjust backend code or use a different strategy.
# For now, let's copy it to a 'public' folder in the backend root.
COPY --from=frontend-build /app/frontend/dist ./public

# Expose port
EXPOSE 5000

# Start backend
CMD ["npm", "start"]
