import fs from 'fs/promises';
import multer from 'multer';
import path from 'path';
import iconv from 'iconv-lite';

const tempFolderPath = path.join(process.cwd(), "storage","temp");

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            await fs.mkdir(tempFolderPath, { recursive: true });
            cb(null, tempFolderPath); 
        } catch (error) {
            cb(error, null);
        }
    },
    filename: (req, file, cb) => {
        file.originalname = iconv.decode(Buffer.from(file.originalname, 'latin1'), 'utf8');
        cb(null, file.originalname); 
    }
});

export const upload = multer({ storage });

