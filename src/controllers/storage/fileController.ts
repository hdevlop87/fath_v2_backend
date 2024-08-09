import { sendSuccess, sendError, withErrorHandler } from '../../services/responseHandler';
import FileValidator from '../../Validators/storage/FileValidator';
import StorageManager from '../../services/StorageManager';
import { msg } from '../../lib/constants/constants';
import { upload } from './multerConfig';
import { promises as fs } from 'fs';
import fileDb from '../../repositories/fileDb';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const fileValidator = new FileValidator();
const storageManager = new StorageManager();
const homeFolderId = storageManager.homeFolderId;

const FileController = {

    getAllFiles: withErrorHandler(async (req, res) => {
        const allFiles = await fileDb.findAllFiles();
        return sendSuccess(res, allFiles, msg.Files_RETRIEVED_SUCCESS);
    }),

    getFilesByParentId: withErrorHandler(async (req, res) => {
        const id = req.params.id;
        const files = await fileDb.findFilesByParentId(id);
        return sendSuccess(res, files, msg.FILES_RETRIEVED_SUCCESS);
    }),

    getFileById: withErrorHandler(async (req, res) => {
        const id = req.params.id;
        const file = await fileValidator.checkFileExists(id)
        return sendSuccess(res, file, msg.file_RETRIEVED_SUCCESS);
    }),

    //=================================================//

    deleteAllFiles: withErrorHandler(async (req, res) => {
        const allFiles = await fileDb.deleteAllFiles();
        return sendSuccess(res, allFiles, msg.FILES_DELETED_SUCCESS);
    }),

    deleteFileById: withErrorHandler(async (req, res) => {
        const id = req.params.id;
        await fileValidator.checkFileExists(id);
        const deletedFile = await fileDb.deleteFileById(id);
        return sendSuccess(res, deletedFile,msg.FILE_DELETED_SUCCESS);
    }),

    deleteFileByPath: withErrorHandler(async (req, res) => {
        const { filePath } = req.body;
        const deletedFile = await fileDb.deleteFileByPath(filePath);
        return sendSuccess(res, deletedFile, msg.FILE_DELETED_SUCCESS);
    }),

    deleteMultiFiles: withErrorHandler(async (req, res) => {
        const { ids } = req.body;
        const deletedFiles = await Promise.all(ids.map(id => fileDb.deleteFileById(id)));
        return sendSuccess(res, deletedFiles, msg.FILES_DELETED_SUCCESS);
    }),

    //=================================================//

    createFile: [
        upload.single('file'),
        withErrorHandler(async (req, res) => {
            const fileDetails = req.file;
            let parentId = req.body.parentId;

            if (!parentId || parentId.trim() === "") {
                parentId = homeFolderId;
            }
            
            const parentFolder = await fileValidator.checkFolderExists(parentId);
            const fileInfo = await storageManager.moveFileFromTemp(parentFolder.path, fileDetails);

            const newFile = await fileDb.insertFile({
                ...fileDetails,
                id: uuidv4(),
                parentId: parentFolder.id,
                filename: fileInfo.filename,
                path: fileInfo.path,
                name: fileInfo.name,
                type: fileInfo.type,
                icon: fileInfo.icon,
                category: fileInfo.category,
            });
            return sendSuccess(res, newFile, msg.FILE_CREATED_SUCCESS, 201);
        }),
    ],

    updateFile: withErrorHandler(async (req, res) => {
        const id = req.params.id;
        const { name } = req.body;

        await fileValidator.checkFileExists(id);
        await fileValidator.checkFileNameExists(name, id);

        const existingFile = await fileDb.findFileById(id);

        let updatedFields = {
            ...existingFile,
            ...req.body,
            updatedAt: new Date(),
        };

        if (name) {
            const type = existingFile.type
            const oldPath = existingFile.path;
            const basePath = path.dirname(oldPath);
            const newPath = path.join(basePath, `${name}.${type}`);

            await fs.rename(oldPath, newPath);

            updatedFields.path = newPath;
            updatedFields.name = name;
            updatedFields.filename = await storageManager.getUniqueName(`${name}.${type}`);
        }

        const updatedFile = await fileDb.updateFile(id, updatedFields);
        return sendSuccess(res, updatedFile, msg.FILE_UPDATED_SUCCESS);
    }),

    moveFile: withErrorHandler(async (req, res) => {
        const { fileId, folderId } = req.body;

        const existingFile = await fileValidator.checkFileExists(fileId);
        const targetFolder = await fileValidator.checkFolderExists(folderId);

        const { name, type } = existingFile;
        const oldPath = existingFile.path;


        const { uniquePath, uniqueName } = await storageManager.getUniqueNameCounter(targetFolder.path, `${name}.${type}`);

        await fs.rename(oldPath, uniquePath);

        const movedFile = {
            ...existingFile,
            parentId: folderId,
            path: uniquePath,
            name: uniqueName,
            filename: path.basename(uniquePath),
        };

        const updatedFile = await fileDb.updateFile(fileId, movedFile);
        return sendSuccess(res, updatedFile, msg.FILE_MOVED_SUCCESS);
    }),

    downloadFile: withErrorHandler(async (req, res) => {
        const id = req.params.id;
        const file = await fileValidator.checkFileExists(id);
        const filePath = file.path;

        res.setHeader('Content-Type', file.mimetype);

        res.download(filePath, file.filename, (err) => {
            if (err) {
                return sendError(res, 'Error downloading the file');
            }
        });
    }),

    
    bulkAddFiles: withErrorHandler(async (req, res) => {

    })

};

export default FileController;
