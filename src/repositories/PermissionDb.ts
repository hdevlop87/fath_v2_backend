import { eq, sql } from "drizzle-orm";
import { db } from '../db/index';
import { permissions } from '../db/schema';
import path from 'path';
import fs from 'fs/promises';
import RoleValidator from '../Validators/auth/RoleValidator';
import { msg } from '../lib/constants/constants';

const roleValidator = new RoleValidator();

const PermissionDb = {

    getAllPermissions: async () => {
        return await db.select().from(permissions);
    },

    getAllPermissionsIds: async () => {
        const permissionsIds = await db.select({
            permissionId: permissions.permissionId
        }).from(permissions);
        return permissionsIds.map(permission => permission.permissionId);
    },

    deleteAllPermissions: async () => {
        await PermissionDb.resetPermissionSequence();
        await db.delete(permissions);
    },

    createPermission: async (details) => {
        await PermissionDb.resetPermissionSequence();
        const [newPermission] = await db.insert(permissions).values(details).returning();
        return newPermission;
    },

    updatePermission: async (permissionId, updatedFields) => {
        const [updatedPermission] = await db.update(permissions)
            .set(updatedFields)
            .where(eq(permissions.permissionId, permissionId))
            .returning();
        return updatedPermission;
    },

    findPermissionById: async (permissionId) => {
        const [permission] = await db.select()
            .from(permissions)
            .where(eq(permissions.permissionId, permissionId));
        return permission;
    },

    deletePermissionById: async (permissionId) => {
        const [deletedPermission] = await db.delete(permissions)
            .where(eq(permissions.permissionId, permissionId))
            .returning();
            await PermissionDb.resetPermissionSequence();
        return deletedPermission;
    },

    initializePermissions: async () => {
        const permissionsPath = path.join(__dirname, '../config', 'permissions.json');
        const permissionsData = JSON.parse(await fs.readFile(permissionsPath, 'utf8'));

        let addedPermissions = [];
        let skippedPermissions = [];

        for (const details of permissionsData) {
            try {
                await roleValidator.checkRoleNameExists(details.permissionName, null);

                const [newPermission] = await db.insert(permissions).values(details).returning();

                addedPermissions.push(newPermission);
            } catch (error) {
                if (error.message.includes(msg.PERMISSION_EXISTS)) {
                    skippedPermissions.push({ details, reason: error.message });
                    continue;
                }
                throw error;
            }
        }

        return { addedPermissions, skippedPermissions };
    },

    resetPermissionSequence: async () => {
        const query = sql`SELECT setval(pg_get_serial_sequence('permissions', 'permissionId'), COALESCE((SELECT MAX("permissionId") + 1 FROM permissions), 1), false)`;
        await db.execute(query);
    }
};

export default PermissionDb;
