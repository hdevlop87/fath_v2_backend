import { roles,permissions,rolesPermissions } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index';
import path from 'path';
import fs from 'fs';
import { msg } from '../lib/constants/constants';
import RoleValidator from '../Validators/auth/RoleValidator';

const roleValidator = new RoleValidator();

const RoleDb = {

    createRole: async (details) => {
        await RoleDb.resetSequence();
        const [newRole] = await db.insert(roles).values(details).returning();
        return newRole;
    },

    updateRole: async (roleId, updatedFields) => {
        const [updatedRole] = await db.update(roles)
            .set(updatedFields)
            .where(eq(roles.roleId, roleId))
            .returning();
        return updatedRole;
    },

    findRoleById: async (roleId) => {
        const [role] = await db
            .select({
                roleId: roles.roleId,
                roleName: roles.roleName,
                description: roles.description,
                permissions: sql`array_agg(${permissions.permissionName})`.as('permissions')
            })
            .from(roles)
            .leftJoin(rolesPermissions, eq(roles.roleId, rolesPermissions.roleId))
            .leftJoin(permissions, eq(rolesPermissions.permissionId, permissions.permissionId))
            .where(eq(roles.roleId, roleId))
            .groupBy(roles.roleId, roles.roleName, roles.description);

        return role;
    },

    deleteRoleById: async (roleId) => {
        const [role] = await db.delete(roles).where(eq(roles.roleId, roleId)).returning();
        await RoleDb.resetSequence();
        return role;
    },

    findAllRoles: async () => {
        const rolesWithPermissions = await db
            .select({
                roleId: roles.roleId,
                roleName: roles.roleName,
                description: roles.description,
                permissions: sql`array_agg(${permissions.permissionName})`.as('permissions')
            })
            .from(roles)
            .leftJoin(rolesPermissions, eq(roles.roleId, rolesPermissions.roleId))
            .leftJoin(permissions, eq(rolesPermissions.permissionId, permissions.permissionId))
            .groupBy(roles.roleId, roles.roleName, roles.description)
            .orderBy(roles.roleName);

        return rolesWithPermissions;
    },

    deleteAllRoles: async () => {
        await RoleDb.resetSequence();
        await db.delete(roles);
    },

    initializeRoles: async () => {
        const rolesPath = path.join(__dirname, '../config', 'roles.json');
        const rolesData = JSON.parse(fs.readFileSync(rolesPath, 'utf8'));

        let addedRoles = [];
        let skippedRoles = [];

        for (const details of rolesData) {
            try {
                await roleValidator.checkRoleNameExists(details.roleName, null);

                const [newRole] = await db.insert(roles).values(details).returning();

                addedRoles.push(newRole);
            }
            catch (error) {
                if (error.message.includes(msg.ROLE_EXISTS)) {
                    skippedRoles.push({ details, reason: error.message });
                    continue;
                }
                throw error;
            }
        }

        return { addedRoles, skippedRoles };
    },

    createAdminRole: async () => {
        let data = {
            roleName: 'Admin',
            description: '',
        }
        const [newRole] = await db.insert(roles).values(data).returning();
        return newRole;
    },

    getAdminRoleId: async () => {
        const [role] = await db.select().from(roles).where(eq(roles.roleName, 'Admin'));
        return role ? role.roleId : null;
    },

    resetSequence: async () => {
        const query = sql`SELECT setval(pg_get_serial_sequence('roles', 'roleId'), COALESCE((SELECT MAX("roleId") + 1 FROM roles), 1), false)`;
        await db.execute(query);
    }
};

export default RoleDb;
