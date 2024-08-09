import { sendSuccess, sendError, withErrorHandler } from '../../services/responseHandler';
import FolderValidator from '../../Validators/storage/FolderValidator';

import { msg } from '../../lib/constants/constants';
import { hashPassword } from '../../lib/utils';
import StorageManager from '../../services/StorageManager';
import folderDb from '../../repositories/folderDb';
import fileDb from '../../repositories/fileDb'
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const folderValidator = new FolderValidator();
const storageManager = new StorageManager();
const homeFolderId = storageManager.homeFolderId;

const protectedFolderNames = ['users', 'expenses', 'payments', 'customers', 'agreements'];

const FolderController = {

    createFolder: withErrorHandler(async (req, res) => {
        let { name, parentId } = req.body;

        if (!parentId || parentId.trim() === "") {
            parentId = homeFolderId;
        }

        await folderValidator.validateFolderSchema(req.body);
        await folderValidator.checkFolderNameExists(name, parentId);
        const parentFolder = await folderValidator.checkFolderExists(parentId);

        const folderPath = path.join(parentFolder.path, name);
        await fs.mkdir(folderPath, { recursive: true });

        const newFolder = await folderDb.insertFolder({
            id: uuidv4(),
            parentId,
            name,
            path: await storageManager.getRelativePath(folderPath)
        });

        return sendSuccess(res, newFolder, msg.FOLDER_CREATED_SUCCESS, 201);
    }),

    updateFolder: withErrorHandler(async (req, res) => {
        const id = req.params.id;
        const folderDetails = req.body;
        const existingFolder = await folderValidator.checkFolderExists(id);
        await folderValidator.checkFolderNameExists(folderDetails.name, id);

        if (folderDetails.name && folderDetails.path) {
            const basePath = path.dirname(folderDetails.path);
            const newPath = path.join(basePath, folderDetails.name);
            const oldPath = existingFolder.path;

            await fs.rename(oldPath, newPath);
            folderDetails.path = newPath;

            const childItems = await folderDb.findAllChildrenByPath(oldPath);

            for (const item of childItems) {
                const updatedPath = item.path.replace(oldPath, newPath);
                if (item.type === 'folder') {
                    await folderDb.updateFolderPath(item.id, updatedPath);
                }
                else {
                    await fileDb.updateFilePath(item.id, updatedPath);
                }
            }
        }

        if (folderDetails.password) {
            const hashedPassword = await hashPassword(folderDetails.password);
            folderDetails.password = hashedPassword;
        }

        folderDetails.updatedAt = new Date();

        const updatedFolder = await folderDb.updateFolder(id, folderDetails);
        return sendSuccess(res, updatedFolder, msg.FOLDER_UPDATED_SUCCESS);
    }),

    //=======================================================//

    getAllFolders: withErrorHandler(async (req, res) => {
        const allFolders = await folderDb.findAllFolders();
        return sendSuccess(res, allFolders, msg.Folders_RETRIEVED_SUCCESS);
    }),

    getFolderById: withErrorHandler(async (req, res) => {
        const id = req.params.id;
        const folder = await folderValidator.checkFolderExists(id)
        return sendSuccess(res, folder, msg.folder_RETRIEVED_SUCCESS);
    }),

    getFoldersByParentId: withErrorHandler(async (req, res) => {
        let id = req.params.id;
        const folders = await folderDb.findFoldersByParentId(id);
        const filteredFolders = folders.filter(folder => 
            !['temp', 'trash', 'home'].includes(folder.name.toLowerCase())
        );
        return sendSuccess(res, filteredFolders, msg.FILES_RETRIEVED_SUCCESS);
    }),

    getFolderByPath: withErrorHandler(async (req, res) => {
        const { path } = req.body;
        const folder = await folderDb.findFolderByPath(path);
        if (!folder) {
            throw new Error('Folder not found');
        }
        return sendSuccess(res, folder, msg.FOLDER_RETRIEVED_SUCCESS);
    }),

    //=======================================================//

    deleteAllFolders: withErrorHandler(async (req, res) => {
        const folders = await folderDb.findAllFolders();
        const deletableFolders = folders.filter(folder => !protectedFolderNames.includes(folder.name.toLowerCase()));
        const deletedFolders = await Promise.all(deletableFolders.map(folder => folderDb.deleteFolderById(folder.id)));
        return sendSuccess(res, deletedFolders, msg.FOLDERS_DELETED_SUCCESS);
    }),

    deleteMultiFolders: withErrorHandler(async (req, res) => {
        const { ids } = req.body;
        const folders = await folderDb.findFoldersByIds(ids);
        const deletableFolders = folders.filter(folder => !protectedFolderNames.includes(folder.name.toLowerCase()));
        const deletedFolders = await Promise.all(deletableFolders.map(folder => folderDb.deleteFolderById(folder.id)));
        return sendSuccess(res, deletedFolders, msg.FILES_DELETED_SUCCESS);
    }),

    deleteFolderById: withErrorHandler(async (req, res) => {
        const id = req.params.id;
        const folder = await folderValidator.checkFolderExists(id);
        if (protectedFolderNames.includes(folder.name.toLowerCase())) {
            throw new Error('This folder cannot be deleted');
        }
        const deletedFolder = await folderDb.deleteFolderById(id);
        return sendSuccess(res, deletedFolder, msg.FOLDER_PERMANENTLY_DELETED_SUCCESS);
    }),

    bulkAddFolders: withErrorHandler(async (req, res) => {

    })
};

export default FolderController;
