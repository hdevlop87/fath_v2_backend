import { sendSuccess, sendError } from '../../services/responseHandler';
import PermissionValidator from '../../services/auth/PermissionValidator';
import RoleValidator from '../../services/auth/RoleValidator';
import asyncHandler from '../../lib/asyncHandler';
import { permissions } from '../../db/schema';
import { msg } from '../../lib/constants';
import { eq, sql } from "drizzle-orm";
import { db } from '../../db/index'
import path from 'path';
import fs from 'fs';

const permissionValidator = new PermissionValidator()
const roleValidator = new RoleValidator();

const PermissionController = {

    getAllPermissions: asyncHandler(async (req, res) => {
        const allPermissions = await db.select().from(permissions);
        sendSuccess(res, allPermissions, msg.PERMISSIONS_RETRIEVED_SUCCESS);
    }),

    deleteAllPermissions: asyncHandler(async (req, res) => {
        await db.delete(permissions);
        await PermissionController.resetPermissionSequence();
        sendSuccess(res, null, msg.PERMISSIONS_DELETED_SUCCESS);
    }),

    //============== one permissions actions ===========================//

    createPermission: asyncHandler(async (req, res) => {
        const { permissionName, description } = req.body;

        await permissionValidator.validatePermissionSchema(req.body);
        await permissionValidator.checkPermissionNameExists(permissionName);

        const [newPermission] = await db.insert(permissions).values({
            permissionName,
            description,
        }).returning();

        sendSuccess(res, newPermission, msg.PERMISSION_CREATED_SUCCESS, 201);
    }),

    updatePermission: asyncHandler(async (req, res) => {

        const permissionId = req.params.id;
        const { permissionName, description } = req.body;

        const existingPermission = await permissionValidator.checkPermissionExists(permissionId);

        await permissionValidator.checkPermissionNameExists(permissionName, permissionId);

        const updatedFields = {
            permissionName: permissionName || existingPermission.permissionName,
            description: description || existingPermission.description,
        };

        const [updatedPermission] = await db.update(permissions)
            .set(updatedFields)
            .where(eq(permissions.permissionId, permissionId))
            .returning();

        sendSuccess(res, updatedPermission, msg.PERMISSION_UPDATED_SUCCESS);
    }),

    getPermissionById: asyncHandler(async (req, res) => {
        const permissionId = req.params.id;
        const [permission] = await db.select()
            .from(permissions)
            .where(eq(permissions.permissionId, permissionId));

        if (!permission) {
            return sendError(res, msg.PERMISSION_NOT_FOUND, 404);
        }

        sendSuccess(res, permission, msg.PERMISSION_RETRIEVED_SUCCESS);
    }),

    deletePermissionById: asyncHandler(async (req, res) => {
        const permissionId = req.params.id;

        await permissionValidator.checkPermissionExists(permissionId);

        const [deletedPermission] = await db.delete(permissions)
            .where(eq(permissions.permissionId, permissionId))
            .returning();

        await PermissionController.resetPermissionSequence();
        sendSuccess(res, deletedPermission, msg.PERMISSION_DELETED_SUCCESS);
    }),

    initializePermissions: asyncHandler(async (req, res) => {
        const permissionsPath = path.join(__dirname, '../config', 'permissions.json');
        const permissionsData = JSON.parse(fs.readFileSync(permissionsPath, 'utf8'));

        let addedPermissions = [];
        let skippedPermissions = [];

        for (const { permissionName, description } of permissionsData) {
            try {
                await roleValidator.checkRoleNameExists(permissionName, null);

                const [newRole] = await db.insert(permissions).values({
                    permissionName,
                    description,
                }).returning();

                addedPermissions.push(newRole);
            }
            catch (error) {
                if (error.message.includes(msg.PERMISSION_EXISTS)) {
                    skippedPermissions.push({ permissionName, description, reason: error.message });
                    continue;
                }
                throw error;
            }
        }

        sendSuccess(res, { addedPermissions, skippedPermissions }, msg.PERMISSIONS_INIT_SUCCESS);
    }),

    async resetPermissionSequence() {
        const query = sql`SELECT setval(pg_get_serial_sequence('permissions', 'permissionId'), COALESCE((SELECT MAX("permissionId") + 1 FROM permissions), 1), false)`;
        await db.execute(query);
    }
};

export default PermissionController;
