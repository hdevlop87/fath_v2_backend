import { sendSuccess, sendError } from '../../../services/responseHandler';
import FileValidator from '../../../services/storage/FileValidator';
import StorageManager from '../../../services/storage/StorageManager';
import asyncHandler from '../../../lib/asyncHandler';
import { msg } from '../../../lib/constants';
import { upload } from './multerConfig';
import { promises as fs } from 'fs';
import fileDb from './fileDb';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const fileValidator = new FileValidator();
const storageManager = new StorageManager();
const homeFolderId = storageManager.homeFolderId;

const FileController = {

    getAllFiles: asyncHandler(async (req, res) => {
        const allFiles = await fileDb.findAllFiles();
        sendSuccess(res, allFiles, msg.Files_RETRIEVED_SUCCESS);
    }),

    getFilesByParentId: asyncHandler(async (req, res) => {
        const id = req.params.id;
        const files = await fileDb.findFilesByParentId(id);
        sendSuccess(res, files, msg.FILES_RETRIEVED_SUCCESS);
    }),

    getFileById: asyncHandler(async (req, res) => {
        const id = req.params.id;
        const file = await fileValidator.checkFileExists(id)
        sendSuccess(res, file, msg.file_RETRIEVED_SUCCESS);
    }),

    //=================================================//

    deleteAllFiles: asyncHandler(async (req, res) => {
        const allFiles = await fileDb.deleteAllFiles();
        sendSuccess(res, allFiles, msg.FILES_DELETED_SUCCESS);
    }),

    deleteFileById: asyncHandler(async (req, res) => {
        const id = req.params.id;
        await fileValidator.checkFileExists(id);
        const deletedFile = await fileDb.deleteFileById(id);
        sendSuccess(res, deletedFile,msg.FILE_DELETED_SUCCESS);
    }),

    deleteFileByPath: asyncHandler(async (req, res) => {
        const { filePath } = req.body;
        const deletedFile = await fileDb.deleteFileByPath(filePath);
        sendSuccess(res, deletedFile, msg.FILE_DELETED_SUCCESS);
    }),

    deleteMultiFiles: asyncHandler(async (req, res) => {
        const { ids } = req.body;
        const deletedFiles = await Promise.all(ids.map(id => fileDb.deleteFileById(id)));
        sendSuccess(res, deletedFiles, msg.FILES_DELETED_SUCCESS);
    }),

    //=================================================//

    createFile: [
        upload.single('file'),
        asyncHandler(async (req, res) => {
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
            sendSuccess(res, newFile, msg.FILE_CREATED_SUCCESS, 201);
        }),
    ],

    updateFile: asyncHandler(async (req, res) => {
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
        sendSuccess(res, updatedFile, msg.FILE_UPDATED_SUCCESS);
    }),

    moveFile: asyncHandler(async (req, res) => {
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
        sendSuccess(res, updatedFile, msg.FILE_MOVED_SUCCESS);
    }),

    downloadFile: asyncHandler(async (req, res) => {
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

};

export default FileController;
