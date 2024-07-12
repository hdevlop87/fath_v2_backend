import { users, roles, permissions, rolesPermissions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';

const UserDb = {

    findAllUsers: async () => {
        return await db.select().from(users);
    },

    deleteUserById: async (userId) => {
        return await db.delete(users).where(eq(users.id, userId)).returning();
    },

    insertUser: async (userDetails) => {
        return await db.insert(users).values(userDetails).returning();
    },

    findUserById: async (userId) => {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        return user
    },

    findUserByEmail: async (email) => {
        return await db.select().from(users).where(eq(users.email, email));
    },

    findUserByUsername: async (username) => {
        return await db.select().from(users).where(eq(users.username, username));
    },

    updateUserById: async (userId, updateFields) => {
        return await db.update(users)
            .set(updateFields)
            .where(eq(users.id, userId))
            .returning();
    },

    deleteAllUsers: async () => {
        return await db.delete(users).returning();
    },

    findRoleById: async (userId) => {
        const [role] = await db.select({
            roleName: roles.roleName,
        })
            .from(users)
            .leftJoin(roles, eq(users.roleId, roles.roleId))
            .where(eq(users.id, userId));
        return role
    },

    findPermissionsById: async (userId) => {
        const results = await db.select({
            permissionId: permissions.permissionId,
            permissionName: permissions.permissionName,
            description: permissions.description,
        })
            .from(users)
            .leftJoin(roles, eq(users.roleId, roles.roleId))
            .leftJoin(rolesPermissions, eq(roles.roleId, rolesPermissions.roleId))
            .leftJoin(permissions, eq(rolesPermissions.permissionId, permissions.permissionId))
            .where(eq(users.id, userId))

        const permissionNames = results
            .filter(permission => permission.permissionId != null)
            .map(permission => permission.permissionName);

        return permissionNames.length > 0 ? permissionNames : [];
    },
};

export default UserDb;

