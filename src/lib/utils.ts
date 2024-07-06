import bcrypt from 'bcryptjs';
import fs from 'fs';
import csv from 'csv-parser';
import { format, parseISO } from 'date-fns';

export const hashPassword = async (password) => {
    if (!password) return
    return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password, hashedPassword) => {
    if (!password || !hashedPassword) return;
    return await bcrypt.compare(password, hashedPassword);
};

export function parseDuration(duration) {
    const unit = duration.slice(-1);
    const value = parseInt(duration, 10); // Ensure base 10 is used for parsing
    let multiplier;

    switch (unit) {
        case 's': // Seconds
            multiplier = 1000; // 1000 milliseconds in a second
            break;
        case 'm': // Minutes
            multiplier = 60 * 1000; // 60 seconds in a minute
            break;
        case 'h': // Hours
            multiplier = 3600 * 1000; // 3600 seconds in an hour
            break;
        case 'd': // Days
            multiplier = 24 * 3600 * 1000; // 24 hours in a day
            break;
        case 'w': // Weeks
            multiplier = 7 * 24 * 3600 * 1000; // 7 days in a week
            break;
        case 'M': // Months, changed from 'm' to 'M' to avoid conflict with minutes
            multiplier = 30 * 24 * 3600 * 1000; // Approx. 30 days in a month
            break;
        case 'y': // Years
            multiplier = 365 * 24 * 3600 * 1000; // 365 days in a year
            break;
        default:
            throw new Error('Unsupported time unit');
    }

    return value * multiplier;
}

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const mimeTypeToInfoMap = {
    "image/svg+xml": { type: "svg", icon: "svg.png", category: "image" },
    "image/*": { type: "image", icon: "image.png", category: "image" },
    "image/png": { type: "png", icon: "png.png", category: "image" },
    "image/jpeg": { type: "jpg", icon: "jpg.png", category: "image" },
    "image/jpg": { type: "jpg", icon: "jpg.png", category: "image" },
    "image/gif": { type: "gif", icon: "gif.png", category: "image" },
    "image/bmp": { type: "bmp", icon: "bmp.png", category: "image" },
    "image/webp": { type: "webp", icon: "image.png", category: "image" },

    "application/pdf": { type: "pdf", icon: "pdf.png", category: "file" },
    
    "application/msword": { type: "doc", icon: "doc.png", category: "file" },
    "application/vnd.openxmlformats-officefile.wordprocessingml.file": { type: "docx", icon: "doc.png", category: "file" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { type: "docx", icon: "doc.png", category: "file" },
    "application/vnd.openxmlformats-officefile.wordprocessingml.template": { type: "docx", icon: "doc.png", category: "file" },
    "application/vnd.ms-word.document.macroEnabled.12": { type: "docm", icon: "doc.png", category: "file" },
    "application/vnd.ms-word.file.macroEnabled.12": { type: "docm", icon: "doc.png", category: "file" },
    "application/vnd.ms-word.template.macroEnabled.12": { type: "docm", icon: "doc.png", category: "file" },
    "application/vnd.oasis.openfile.text": { type: "odt", icon: "odt.png", category: "file" },
    "application/vnd.oasis.opendocument.text": { type: "odt", icon: "odt.png", category: "file" },

    "application/vnd.ms-excel": { type: "xls", icon: "xls.png", category: "file" }, 
    "application/vnd.openxmlformats-officefile.fileml.sheet": { type: "xlsx", icon: "xls.png", category: "file" },
    "application/vnd.openxmlformats-officefile.fileml.template": { type: "xlsx", icon: "xls.png", category: "file" },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { type: "xlsx", icon: "xls.png", category: "file" },
    "application/vnd.ms-excel.sheet.macroEnabled.12": { type: "xlsm", icon: "xls.png", category: "file" },
    "application/vnd.ms-excel.template.macroEnabled.12": { type: "xlsm", icon: "xls.png", category: "file" },
    "application/vnd.ms-excel.addin.macroEnabled.12": { type: "xlam", icon: "xls.png", category: "file" },
    "application/vnd.ms-excel.sheet.binary.macroEnabled.12": { type: "xlsb", icon: "xls.png", category: "file" },
    "application/vnd.oasis.openfile.file": { type: "ods", icon: "ods.png", category: "file" },
    
    "application/vnd.ms-powerpoint": { type: "ppt", icon: "ppt.png", category: "file" },
    "application/vnd.openxmlformats-officefile.presentationml.presentation": { type: "pptx", icon: "ppt.png", category: "file" },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": { type: "pptx", icon: "ppt.png", category: "file" },
    "application/vnd.openxmlformats-officefile.presentationml.template": { type: "pptx", icon: "ppt.png", category: "file" },
    "application/vnd.oasis.openfile.presentation": { type: "odp", icon: "odp.png", category: "file" },

    "audio/mp3": { type: "mp3", icon: "mp3.png", category: "audio" },
    "audio/wav": { type: "wav", icon: "wav.png", category: "audio" },
    "audio/ogg": { type: "ogg", icon: "ogg.png", category: "audio" },
    "audio/flac": { type: "flac", icon: "flac.png", category: "audio" },

    "text/plain": { type: "txt", icon: "txt.png", category: "file" },

    "video/x-msvideo": { type: "avi", icon: "avi.png", category: "video" },
    "video/mp4": { type: "mp4", icon: "mp4.png", category: "video" },
    "video/quicktime": { type: "mov", icon: "mov.png", category: "video" },
    "video/x-matroska": { type: "mkv", icon: "mkv.png", category: "video" },
    "video/webm": { type: "webm", icon: "webm.png", category: "video" },
    

    "text/csv": { type: "csv", icon: "csv.png", category: "file" },
    "application/javascript": { type: "javascript", icon: "javascript.png", category: "file" },

    "application/json": { type: "json", icon: "json-file.png", category: "file" },
    "application/xml": { type: "xml", icon: "xml.png", category: "file" },
    "text/xml": { type: "xml", icon: "xml.png", category: "file" },
    "text/html": { type: "html", icon: "html.png", category: "file" },
    "text/css": { type: "css", icon: "css.png", category: "file" },

    "application/postscript": { type: "ai", icon: "illustrator.png", category: "file" },
    "application/illustrator": { type: "ai", icon: "illustrator.png", category: "file" },
    "image/vnd.adobe.photoshop": { type: "psd", icon: "photoshop.png", category: "file" },

    "custom/after-effects": { type: "aep", icon: "after-effects.png", category: "file" },
    "custom/premiere": { type: "prproj", icon: "premiere.png", category: "file" },

    "application/zip": { type: "zip", icon: "zip.png", category: "file" },
    "application/x-zip-compressed": { type: "zip", icon: "zip.png", category: "file" },
    "application/x-tar": { type: "tar", icon: "tar.png", category: "file" },
    "application/x-7z-compressed": { type: "7z", icon: "7z.png", category: "file" },
    "application/x-rar-compressed": { type: "rar", icon: "rar.png", category: "file" },

    "default": { type: "file", icon: "file.png", category: "file" },

    "application/x-python-code": { type: "py", icon: "py.png", category: "file" },
    "application/vnd.visio": { type: "vsd", icon: "vsd.png", category: "file" },
    "application/x-msaccess": { type: "mdb", icon: "mdb.png", category: "file" },
    "application/x-sqlite3": { type: "sqlite", icon: "sqlite.png", category: "file" },
};

export function getFileTypeInfo(mimeType) {
    const info = mimeTypeToInfoMap[mimeType] || mimeTypeToInfoMap["default"];
    return info;
}

export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const parseCSVFile = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv({
                mapHeaders: ({ header }) => header.trim().replace(/^["']|["']$/g, '')
            }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
};

export const formatNumber = (value) => {
    let number = parseFloat(value);
    return number % 1 === 0 ? Math.floor(number) : number.toFixed(2);
 };

export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd');
 };
 
 
 export function formatCommas(x) {
   return x?.toString().replace(/(\d)(?=(\d{4})+(?!\d))/g, '$1,');
 }