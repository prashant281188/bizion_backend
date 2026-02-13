import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

/* ================= CONSTANTS ================= */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

const XLS_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
];

const XLS_EXTENSIONS = [".xlsx", ".xls", ".csv"];

/* ================= PATHS ================= */

const uploadRoot = path.join(process.cwd(), "uploads");
const productImagePath = path.join(uploadRoot, "products");

if (!fs.existsSync(productImagePath)) {
  fs.mkdirSync(productImagePath, { recursive: true });
}

/* ================= HELPERS ================= */

function sanitizeFilename(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");
}

function generateFilename(originalname: string) {
  const ext = path.extname(originalname).toLowerCase();
  const hash = crypto.randomBytes(8).toString("hex");
  return `${Date.now()}-${hash}${ext}`;
}

/* ================= XLS UPLOAD (MEMORY) ================= */

export const uploadXls = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (
      XLS_EXTENSIONS.includes(ext) &&
      XLS_MIME_TYPES.includes(file.mimetype)
    ) {
      return cb(null, true);
    }

    cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        "Only .xlsx, .xls, .csv files are allowed"
      )
    );
  },
});

/* ================= IMAGE UPLOAD (DISK) ================= */

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, productImagePath);
  },
  filename: (_req, file, cb) => {
    const safeName = generateFilename(file.originalname);
    cb(null, safeName);
  },
});

export const uploadImages = multer({
  storage: imageStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (
      IMAGE_EXTENSIONS.includes(ext) &&
      IMAGE_MIME_TYPES.includes(file.mimetype)
    ) {
      return cb(null, true);
    }

    cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        "Only image files (.jpg, .jpeg, .png, .webp) are allowed"
      )
    );
  },
});
