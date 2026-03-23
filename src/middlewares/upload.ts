import multer from "multer";
import path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

const XLS_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
];
const XLS_EXTENSIONS = [".xlsx", ".xls", ".csv"];

/* ================= XLS UPLOAD (memory) ================= */

export const uploadXls = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (XLS_EXTENSIONS.includes(ext) && XLS_MIME_TYPES.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only .xlsx, .xls, .csv files are allowed"));
  },
});

/* ================= IMAGE UPLOAD (memory → S3) ================= */

export const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (IMAGE_EXTENSIONS.includes(ext) && IMAGE_MIME_TYPES.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only image files (.jpg, .jpeg, .png, .webp) are allowed"));
  },
});
