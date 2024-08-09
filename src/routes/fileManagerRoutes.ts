import FileController from '../controllers/storage/fileController';
import FolderController from '../controllers/storage/folderController';
import { hasPermission } from '../middleware';
import {PERMISSIONS} from '../lib/constants/permissions'

export const fileManagerRoutes = [
    // Files routes
    { path: 'files/deleteMulti', method: 'post', handler: FileController.deleteMultiFiles, middlewares: [hasPermission(PERMISSIONS.DELETE_FILE)] },
    { path: 'files/parent/:id', method: 'get', handler: FileController.getFilesByParentId, middlewares: [hasPermission(PERMISSIONS.READ_FILE)] },
    { path: 'files', method: 'get', handler: FileController.getAllFiles, middlewares: [hasPermission(PERMISSIONS.READ_FILE)] },
    { path: 'files', method: 'post', handler: FileController.bulkAddFiles, middlewares: [hasPermission(PERMISSIONS.CREATE_FILE)] },
    // File routes
    { path: 'file/byPath', method: 'delete', handler: FileController.deleteFileByPath, middlewares: [hasPermission(PERMISSIONS.DELETE_FILE)] },
    { path: 'file/download/:id', method: 'get', handler: FileController.downloadFile, middlewares: [hasPermission(PERMISSIONS.DOWNLOAD_FILE)] },
    { path: 'file', method: 'post', handler: FileController.createFile, middlewares: [hasPermission(PERMISSIONS.CREATE_FILE)] },
    { path: 'file/:id', method: 'get', handler: FileController.getFileById, middlewares: [hasPermission(PERMISSIONS.READ_FILE)] },
    { path: 'file/:id', method: 'patch', handler: FileController.updateFile, middlewares: [hasPermission(PERMISSIONS.UPDATE_FILE)] },
    { path: 'file/:id', method: 'delete', handler: FileController.deleteFileById, middlewares: [hasPermission(PERMISSIONS.DELETE_FILE)] },

    // Folders routes
    { path: 'folders/deleteMulti', method: 'post', handler: FolderController.deleteMultiFolders, middlewares: [hasPermission(PERMISSIONS.DELETE_FOLDER)] },
    { path: 'folders/parent/:id', method: 'get', handler: FolderController.getFoldersByParentId, middlewares: [hasPermission(PERMISSIONS.READ_FOLDER)] },
    { path: 'folders', method: 'get', handler: FolderController.getAllFolders, middlewares: [hasPermission(PERMISSIONS.READ_FOLDER)] },
    { path: 'folders', method: 'post', handler: FolderController.bulkAddFolders, middlewares: [hasPermission(PERMISSIONS.CREATE_FOLDER)] },
    // Folder routes
    { path: 'folder', method: 'post', handler: FolderController.createFolder, middlewares: [hasPermission(PERMISSIONS.CREATE_FOLDER)] },
    { path: 'folder/:id', method: 'get', handler: FolderController.getFolderById, middlewares: [hasPermission(PERMISSIONS.READ_FOLDER)] },
    { path: 'folder/:id', method: 'patch', handler: FolderController.updateFolder, middlewares: [hasPermission(PERMISSIONS.UPDATE_FOLDER)] },
    { path: 'folder/:id', method: 'delete', handler: FolderController.deleteFolderById, middlewares: [hasPermission(PERMISSIONS.DELETE_FOLDER)] },
];
