import { eq, and, sql,inArray } from "drizzle-orm";
import { db } from '../db/index';
import { rolesPermissions, permissions,roles } from '../db/schema';


const RolePermissionDb = {

    assignPermissionToRole: async (roleId, permissionId) => {
        const [newRolePermission] = await db.insert(rolesPermissions).values({
            roleId,
            permissionId,
        }).returning();
        return newRolePermission;
    },

    assignPermissionsToRole: async (roleId, permissionIds) => {
        const addedPermissions = [];
        const skippedPermissions = [];

        for (const permissionId of permissionIds) {
            const isAssigned = await RolePermissionDb.isPermissionAssignedToRole(roleId, permissionId);

            if (!isAssigned) {
                const [newRolePermission] = await db.insert(rolesPermissions).values({
                    roleId,
                    permissionId,
                }).returning();
                addedPermissions.push(newRolePermission);
            } else {
                skippedPermissions.push({ roleId, permissionId });
            }
        }

        return { addedPermissions, skippedPermissions };
    },

    assignPermissionsToRoleByNames: async (roleId, permissionNames) => {
        const permissionsData = await db.select({
            permissionId: permissions.permissionId,
            permissionName: permissions.permissionName,
        })
        .from(permissions)
        .where(inArray(permissions.permissionName, permissionNames));
        
        const permissionIds = permissionsData.map(permission => permission.permissionId);
        const result = await RolePermissionDb.assignPermissionsToRole(roleId, permissionIds);
        
        return result;
    },

    removePermissionFromRole: async (roleId, permissionId) => {
        const [deletedRolePermission] = await db.delete(rolesPermissions)
            .where(and(eq(rolesPermissions.roleId, roleId), eq(rolesPermissions.permissionId, permissionId)))
            .returning();
        return deletedRolePermission;
    },

    removeAllPermissionsFromRole: async (roleId) => {
        const deletedRolePermissions = await db.delete(rolesPermissions)
            .where(eq(rolesPermissions.roleId, roleId))
            .returning();
        return deletedRolePermissions;
    },

    getPermissionsByRoleId: async (roleId) => {
        let rolePermissions = await db.select({
            permissionId: permissions.permissionId,
            permissionName: permissions.permissionName,
            description: permissions.description,
        })
        .from(permissions)
        .leftJoin(rolesPermissions, eq(permissions.permissionId, rolesPermissions.permissionId))
        .where(eq(rolesPermissions.roleId, roleId));
        return rolePermissions;
    },

    getPermissionsByRoleName: async (roleName) => {
        let rolePermissions = await db.select({
            permissionId: permissions.permissionId,
            permissionName: permissions.permissionName,
            description: permissions.description,
        })
        .from(permissions)
        .leftJoin(rolesPermissions, eq(permissions.permissionId, rolesPermissions.permissionId))
        .leftJoin(roles, eq(roles.roleId, rolesPermissions.roleId))
        .where(eq(roles.roleName, roleName));
        return rolePermissions;
    },

    isPermissionAssignedToRole: async (roleId, permissionId) => {
        const existingAssignment = await db.select().from(rolesPermissions)
            .where(and(eq(rolesPermissions.roleId, roleId), eq(rolesPermissions.permissionId, permissionId)));

        return existingAssignment.length > 0;
    },
};

export default RolePermissionDb;
