import path from 'path';
import fs from 'fs/promises';
import { db } from './db/index';
import { roles, permissions, settings } from './db/schema';
import RoleValidator from './Validators/auth/RoleValidator';
import PermissionValidator from './Validators/auth/PermissionValidator';
import { msg } from './lib/constants/constants';
import folderDb from './repositories/folderDb';
import PermissionDb from './repositories/PermissionDb';
import RoleDb from './repositories/RoleDb';
import UserDb from './repositories/UserDb';
import RolePermissionDb from './repositories/RolePermissionDb';
import { hashPassword } from './lib/utils';
import StorageManager from './services/StorageManager';
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
    const homeFolderId = process.env.HOME_FOLDER_ID;
    const tempFolderId = process.env.TEMP_FOLDER_ID;
    const trashFolderId = process.env.TRASH_FOLDER_ID;
    const usersFolderId = process.env.USER_FOLDER_ID;
    const expensesFolderId = process.env.EXPENSES_FOLDER_ID;
    const paymentsFolderId = process.env.PAYMENTS_FOLDER_ID;
    const customersFolderId = process.env.CUSTOMERS_FOLDER_ID;
    const agreementsFolderId = process.env.AGREEMENTS_FOLDER_ID;
   
    const folders = [
        { id: homeFolderId, name: 'home', parentId: null, isPhysical: true },
        { id: tempFolderId, name: 'temp', parentId: homeFolderId, isPhysical: true },
        { id: trashFolderId, name: 'trash', parentId: homeFolderId, isPhysical: true },
        { id: usersFolderId, name: 'users', parentId: homeFolderId, isPhysical: true },
        { id: expensesFolderId, name: 'expenses', parentId: homeFolderId, isPhysical: true },
        { id: paymentsFolderId, name: 'payments', parentId: homeFolderId, isPhysical: true },
        { id: customersFolderId, name: 'customers', parentId: homeFolderId, isPhysical: true },
        { id: agreementsFolderId, name: 'agreements', parentId: homeFolderId, isPhysical: true }
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

        const adminRoleId = await RoleDb.getAdminRoleId();
        const permissionIds = await PermissionDb.getAllPermissionsIds();
        await RolePermissionDb.assignPermissionsToRole(adminRoleId, permissionIds);

        console.log(msg.PERMISSIONS_ASSIGNED_TO_ADMIN_SUCCESS);

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
