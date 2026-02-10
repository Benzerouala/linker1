import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vérifier si Cloudinary est configuré
const isCloudinaryConfigured = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  return !!(cloud_name && api_key && api_secret);
};

// Configuration du stockage
let storage;

if (isCloudinaryConfigured()) {
  // ✅ Utiliser Cloudinary si configuré
  console.log("✅ Upload middleware: Utilisation de Cloudinary");

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "linker-uploads", // Dossier dans Cloudinary
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "mp4", "webm"],
      resource_type: "auto", // Détecte automatiquement image/video
      transformation: [
        { width: 1200, height: 1200, crop: "limit" }, // Limite la taille max
      ],
    },
  });
} else {
  // ⚠️ Fallback vers stockage local
  console.log("⚠️ Upload middleware: Cloudinary non configuré - utilisation du stockage local");

  const uploadsDir = path.join(__dirname, "../uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("✅ Dossier uploads créé:", uploadsDir);
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const finalFilename = uniqueSuffix + path.extname(file.originalname);
      cb(null, finalFilename);
    },
  });
}

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Type de fichier non supporté"), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

export default upload;

