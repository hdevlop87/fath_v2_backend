import fs from 'fs/promises';
import path from 'path';
import { getFileTypeInfo } from '../../lib/utils';
import folderDb from '../../controllers/storage/folderController/folderDb';
import { v4 as uuidv4 } from 'uuid';

class StorageManager {
    static instance = null;
    basePath: string;
    tempFolderPath: string;
    homeFolderId: string;
    trashFolderId: any;
    trashFolderPath: string;
    folders: { id: any; name: string; parentId: any; }[];
    tempFolderId: string;

    constructor() {
        if (StorageManager.instance) {
            return StorageManager.instance;
        }
        this.basePath = path.join(process.cwd(), "storage");
        this.tempFolderPath = path.join(this.basePath, "temp");
        this.homeFolderId = "00000000-0000-0000-0000-000000000000";
        this.trashFolderId= "11111111-1111-1111-1111-111111111111";
        this.tempFolderId = "22222222-2222-2222-2222-222222222222";
    }


    getBaseDir() {
        return this.basePath;
    }

    async getFolderPath(folderId: string) {
        const folder = await folderDb.findFolderById(folderId);
        return folder.path;
    }

    async getPath(folderId: string, fileName: string = '') {
        const folderPath: any = await this.getFolderPath(folderId);
        return path.join(folderPath, fileName);
    }

    async getUUID() {
        return uuidv4()
    }

    async cleanTempFolder() {
        const files = await fs.readdir(this.tempFolderPath);
        const deletionPromises = files.map(file => fs.unlink(path.join(this.tempFolderPath, file)));
        await Promise.all(deletionPromises);
    }

    async moveFileFromTemp(parentFolderPath = "", fileDetails) {
        const destinationDir = parentFolderPath || this.basePath;
        const { originalname } = fileDetails;
        await fs.mkdir(destinationDir, { recursive: true });

        const fileTypeInfo = getFileTypeInfo(fileDetails.mimetype);

        const { uniquePath, uniqueName } = await this.getUniquePath(destinationDir, originalname);
        const filename = await this.getUniqueName(originalname);
        const tempPath = path.join(this.tempFolderPath, originalname);
        await fs.rename(tempPath, uniquePath);

        return {
            name: uniqueName,
            path: await this.getRelativePath(uniquePath),
            filename,
            type: fileTypeInfo.type,
            icon: fileTypeInfo.icon,
            category: fileTypeInfo.category,
        };
    }

    async getRelativePath(Path) {
        return path.relative(process.cwd(), Path);
    }

    async getUniqueName(name) {
        const { name: baseName, extension } = this.splitNameAndExtension(name);
        const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
        return `${baseName}_${timestamp}.${extension}`;
    }

    async getUniquePath(destinationDir, originalName) {
        const { uniqueName, uniquePath } = await this.getUniqueNameCounter(destinationDir, originalName);
        return { uniquePath, uniqueName };
    }

    async getUniqueNameCounter(destinationDir, originalName) {
        let uniquePath = path.join(destinationDir, originalName);

        let counter = 1;
        let uniqueName = this.splitNameAndExtension(originalName).name;
        while (await this.fileExists(uniquePath)) {
            const { name: baseName, extension } = this.splitNameAndExtension(originalName);
            uniqueName = `${baseName} (${counter})`;
            uniquePath = path.join(destinationDir, `${uniqueName}.${extension}`);
            counter++;
        }
        return { uniquePath, uniqueName };
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch (error) {
            return false;
        }
    }

    splitNameAndExtension(fileName) {
        const extension = path.extname(fileName);
        const name = path.basename(fileName, extension);
        return { name, extension: extension.slice(1) };
    }

    static getInstance() {
        if (!StorageManager.instance) {
            StorageManager.instance = new StorageManager();
        }
        return StorageManager.instance;
    }
}

export default StorageManager;
