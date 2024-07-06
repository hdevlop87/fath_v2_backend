import asyncHandler from '../../../lib/asyncHandler';
import { eq, and } from "drizzle-orm";
import { db } from '../../../db/index';
import { rolesPermissions, permissions } from '../../../db/schema';
import { sendSuccess, sendError } from '../../../services/responseHandler';
import RoleValidator from '../../../services/auth/RoleValidator';
import PermissionValidator from '../../../services/auth/PermissionValidator';
import { msg } from '../../../lib/constants';

const roleValidator = new RoleValidator();
const permissionValidator = new PermissionValidator();

const RolePermissionController = {

    assignPermissionToRole: asyncHandler(async (req, res) => {
        const { roleId, permissionId } = req.body;

        await roleValidator.checkRoleExists(roleId);
        await permissionValidator.checkPermissionExists(permissionId);
        await roleValidator.checkPermissionRoleExists(roleId, permissionId); 

        const [newRolePermission] = await db.insert(rolesPermissions).values({
            roleId,
            permissionId,
        }).returning();

        sendSuccess(res, newRolePermission, msg.ROLE_PERMISSION_ASSIGNED_SUCCESS);
    }),

    removePermissionFromRole: asyncHandler(async (req, res) => {
        const { roleId, permissionId } = req.body;

        await roleValidator.checkRoleExists(roleId);
        await permissionValidator.checkPermissionExists(permissionId);

        const [deletedRolePermission] = await db.delete(rolesPermissions)
            .where(and(eq(rolesPermissions.roleId, roleId), eq(rolesPermissions.permissionId, permissionId)))
            .returning();

        if (!deletedRolePermission) {
            return sendError(res, msg.ROLE_PERMISSION_NOT_FOUND, 404);
        }

        sendSuccess(res, deletedRolePermission, msg.ROLE_PERMISSION_REMOVED_SUCCESS);
    }),

    getPermissionsRole: asyncHandler(async (req, res) => {
        const roleId = req.params.id;
        await roleValidator.checkRoleExists(roleId);

        let rolePermissions = await db.select({
            permissionId: permissions.permissionId,
            permissionName: permissions.permissionName,
            description: permissions.description,
        })
        .from(permissions)
        .leftJoin(rolesPermissions, eq(permissions.permissionId, rolesPermissions.permissionId))
        .where(eq(rolesPermissions.roleId, roleId))

        sendSuccess(res, rolePermissions, msg.ROLE_PERMISSIONS_RETRIEVED_SUCCESS);
    }),

};

export default RolePermissionController;
