import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 DEBUG Cloudinary ENV:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'undefined'
});

// Configuration Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Vérifier la configuration au démarrage
const verifyCloudinaryConfig = () => {
    const { cloud_name, api_key, api_secret } = cloudinary.config();

    if (!cloud_name || !api_key || !api_secret) {
        console.warn('⚠️ Cloudinary non configuré - utilisation du stockage local');
        return false;
    }

    console.log('✅ Cloudinary configuré:', cloud_name);
    return true;
};

export { cloudinary, verifyCloudinaryConfig };
export default cloudinary;
