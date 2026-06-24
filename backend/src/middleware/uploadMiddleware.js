import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import ApiError from "../utils/apiError.js";
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir;

    // DIRECT + SAFE (NO STRING MATCHING)
    if (req.params.projectId) {
      uploadDir = path.join(
        __dirname,
        "../uploads/projects",
        req.params.projectId,
      );
    } else if (req.params.userId) {
      uploadDir = path.join(__dirname, "../uploads/users", req.params.userId);
    } else {
      uploadDir = path.join(__dirname, "../uploads/temp");
    }

    ensureDirExists(uploadDir);
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 10, // 10MB
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    logger.info("Incoming file:", file);
    const allowedTypes = [
      ".pdf", ".doc", ".csv", ".docx", ".png", ".jpg", ".jpeg", ".gif",
      ".bmp", ".svg", ".webp", ".pptx", ".ppt", ".txt", ".rar", ".zip",
      ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".cpp", ".c", ".h",
      ".css", ".html", ".json", ".sql", ".rs", ".go", ".php", ".rb",
      ".swift", ".kt", ".dart", ".md", ".ipynb", ".xml", ".yaml", ".yml",
      ".sh", ".bat"
    ];

    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    logger.info(`File extension: ${ext}, Mimetype: ${mime}`);
    
    // Ensure the mime starts with a valid data type indicator
    const isSafeMime = mime.startsWith('image/') || mime.startsWith('application/') || mime.startsWith('text/') || mime.startsWith('video/');
    
    if (!allowedTypes.includes(ext) || !isSafeMime || ext.length === 0) {
      return cb(
        new ApiError(
          400,
          "Invalid file type. Allowed: Documents, Images, Archives, and common Code files.",
        ),
      );
    }
    logger.info("✅ File accepted");
    cb(null, true);
  },
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new ApiError(400, "File size exceeds 10MB"));
    }
    if (
      err.code === "LIMIT_FILE_COUNT" ||
      err.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      return next(
        new ApiError(
          400,
          "Too many files uploaded or potentially unexpected field",
        ),
      );
    }
  }
  next(err);
};

export { upload, handleMulterError };
