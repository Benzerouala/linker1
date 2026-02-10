// frontend/src/utils/api.js
// Si VITE_API_URL est défini dans .env, on l'utilise
// Sinon, si on est en développement, on utilise localhost
// Sinon (production), on utilise l'URL de déploiement (Render ou Railway)
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "https://backend-app-linker.onrender.com/api");
export default API_URL;
