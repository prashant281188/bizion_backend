import multer from 'multer'

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