import multer from 'multer'
import path from 'path';
import fs from 'fs'

export const uploadXls = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = [".xlsx", ".xls", ".csv"];
        const name = file.originalname.toLowerCase();
        if (!allowed.some(ext => name.endsWith(ext))) {
            return cb(new Error("only .xlsx, .xls, .csv files are allowed"))
        }
        cb(null, true)
    }
})


const uploadImagesPath = path.join(__dirname, "../uploads/products")

if (!fs.existsSync(uploadImagesPath))
    fs.mkdirSync(uploadImagesPath, { recursive: true })

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadImagesPath)
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext)
    }
})

const fileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) {
        cb(null, true)
    }
    else {
        cb(new Error("Only .jpeg, .jpg, .png, .webp files are allowed"))
    }
}

export const uploadImages = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
})