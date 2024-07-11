import path from 'path';
import fs from 'fs/promises';
import { db } from './db/index';
import { roles, permissions, settings } from './db/schema';
import RoleValidator from './services/auth/RoleValidator';
import PermissionValidator from './services/auth/PermissionValidator';
import { msg } from './lib/constants';
import folderDb from './controllers/storage/folderController/folderDb';
import UserDb from './controllers/auth/UserController/UserDb';
import { hashPassword } from './lib/utils';
import StorageManager from './services/storage/StorageManager';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const roleValidator = new RoleValidator();
const permissionValidator = new PermissionValidator();
const storageManager = new StorageManager();

const initializeRoles = async () => {
    const rolesPath = path.join(__dirname, 'config', 'roles.json');
    const rolesData = JSON.parse(await fs.readFile(rolesPath, 'utf8'));

    for (const { roleName, description } of rolesData) {
        try {
            await roleValidator.checkRoleNameExists(roleName, null);
            await db.insert(roles).values({ roleName, description }).returning();
        } catch (error) {
            if (!error.message.includes(msg.ROLE_EXISTS)) {
                console.error(error.message);
            }
        }
    }

    console.log(msg.ROLES_INIT_SUCCESS);
};

const initializePermissions = async () => {
    const permissionsPath = path.join(__dirname, 'config', 'permissions.json');
    const permissionsData = JSON.parse(await fs.readFile(permissionsPath, 'utf8'));

    for (const { permissionName, description } of permissionsData) {
        try {
            await permissionValidator.checkPermissionNameExists(permissionName, null);
            await db.insert(permissions).values({ permissionName, description }).returning();
        } catch (error) {
            if (!error.message.includes(msg.PERMISSION_EXISTS)) {
                console.error(error.message);
            }
        }
    }
    console.log(msg.PERMISSIONS_INIT_SUCCESS);
};

const initializeFolders = async () => {
    const basePath = storageManager.basePath;
    const homeFolderId = storageManager.homeFolderId;
    const tempFolderId = storageManager.tempFolderId;

    const folders = [
        { id: homeFolderId, name: 'home', parentId: null, isPhysical: true },
        { id: tempFolderId, name: 'temp', parentId: homeFolderId, isPhysical: true },
        { id: tempFolderId, name: 'trash', parentId: homeFolderId, isPhysical: true },
        { id: "33333333-3333-3333-3333-333333333333", name: 'users', parentId: homeFolderId, isPhysical: true },
        { id: "44444444-4444-4444-4444-444444444444", name: 'expenses', parentId: homeFolderId, isPhysical: true },
        { id: "55555555-5555-5555-5555-555555555555", name: 'payments', parentId: homeFolderId, isPhysical: true },
        { id: "66666666-6666-6666-6666-666666666666", name: 'customers', parentId: homeFolderId, isPhysical: true },
        { id: "77777777-7777-7777-7777-777777777777", name: 'agreements', parentId: homeFolderId, isPhysical: true }
    ];

    for (const folder of folders) {
        const existingFolder = await folderDb.findFolderById(folder.id);
        if (!existingFolder) {
            let folderPath;
            if (folder.isPhysical) {
                folderPath = path.join(basePath, folder.name);
                await fs.mkdir(folderPath, { recursive: true });
            } else {
                folderPath = path.join(basePath, 'home', folder.name);
            }
            await folderDb.insertFolder({
                id: folder.id,
                parentId: folder.parentId,
                name: folder.name,
                path: path.relative(process.cwd(), folderPath),
            });
        }
    }
    console.log('Folders initialization completed successfully');
};

const initializeAdminUser = async () => {
    try {
        const adminRole = await roleValidator.findRoleByName('Admin');

        if (!adminRole) {
            throw new Error(msg.ROLE_NOT_FOUND);
        }

        const [existingAdmin] = await UserDb.findUserByUsername(process.env.ADMIN_USERNAME);

        if (!existingAdmin) {
            const hashedPassword = await hashPassword(process.env.ADMIN_PASSWORD); 
            const adminUser = {
                id: uuidv4(),
                name: process.env.ADMIN_NAME,
                username: process.env.ADMIN_USERNAME,
                email: process.env.ADMIN_EMAIL,
                emailVerified: true,
                password: hashedPassword,
                roleId: adminRole.roleId,
                status: 'Active',
            };

            await UserDb.insertUser(adminUser);
            console.log(msg.ADMIN_USER_CREATED_SUCCESS);
        } else {
            console.log(msg.ADMIN_USER_ALREADY_EXISTS);
        }
    } catch (error) {
        console.error(`${msg.USER_NOT_FOUND}: ${error.message}`);
    }
};

const initializeAppSettings = async () => {
    const settingsPath = path.join(__dirname, 'config', 'settings.json');
    const settingsData = JSON.parse(await fs.readFile(settingsPath, 'utf8'));

    const [existingSettings] = await db.select().from(settings);
    if (!existingSettings) {
        await db.insert(settings).values(settingsData).returning();
        console.log('App settings initialization completed successfully');
    } else {
        console.log('App settings already exist');
    }
};

const initializeApp = async () => {
    try {
        await initializeRoles();
        await initializePermissions();
        await initializeFolders();
        await initializeAdminUser();
        await initializeAppSettings();
        console.log(msg.APP_INIT_COMPLETE);
    } catch (error) {
        console.error(msg.APP_INIT_FAILED, error);
    }
};

initializeApp();
