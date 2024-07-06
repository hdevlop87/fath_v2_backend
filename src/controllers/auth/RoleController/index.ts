import { sendSuccess } from '../../../services/responseHandler';
import RoleValidator from '../../../services/auth/RoleValidator';
import asyncHandler from '../../../lib/asyncHandler'
import { msg } from '../../../lib/constants';
import { roles } from '../../../db/schema';
import { eq, sql } from "drizzle-orm";
import { db } from '../../../db/index';
import path from 'path';
import fs from 'fs';

const roleValidator = new RoleValidator()

const RoleController = {

    createRole: asyncHandler(async (req, res) => {
        const { roleName, description } = req.body;

        await roleValidator.validateRoleSchema(req.body);
        await roleValidator.checkRoleNameExists(roleName);

        const [newRole] = await db.insert(roles).values({ 
            roleName,
            description,
        }).returning();

        sendSuccess(res, newRole, msg.ROLE_CREATED_SUCCESS, 201);
    }),

    updateRole: asyncHandler(async (req, res) => {
        const roleId = req.params.id;
        const { roleName, description } = req.body;

        await roleValidator.validateRoleSchema(req.body);
        await roleValidator.checkRoleNameExists(roleName,roleId);
        
        const existingRole = await roleValidator.checkRoleExists(roleId)

        const updatedFields = {
            roleName: roleName || existingRole.roleName,
            description: description || existingRole.description,
        };

        const [updatedRole] = await db.update(roles)
            .set(updatedFields)
            .where(eq(roles.roleId, roleId))
            .returning();

        sendSuccess(res, updatedRole, msg.ROLE_UPDATED_SUCCESS);
    }),

    getRoleById: asyncHandler(async (req, res) => {
        const roleId = req.params.id;
        const role = await roleValidator.checkRoleExists(roleId)
        sendSuccess(res, role, msg.ROLE_RETRIEVED_SUCCESS);
    }),

    deleteRoleById: asyncHandler(async (req, res) => {
        const roleId = req.params.id;
        await roleValidator.checkRoleExists(roleId);
        
        const [role] = await db.delete(roles)
            .where(eq(roles.roleId, roleId))
            .returning();

        await RoleController.resetSequence();
        sendSuccess(res, role, msg.ROLE_DELETED_SUCCESS);
    }),

    getAllRoles: asyncHandler(async (req, res) => {
        const allRoles = await db.select().from(roles);
        sendSuccess(res, allRoles, msg.ROLES_RETRIEVED_SUCCESS);
    }),

    deleteAllRoles: asyncHandler(async (req, res) => {
        await db.delete(roles);
        await RoleController.resetSequence();
        sendSuccess(res, null, msg.ROLES_DELETED_SUCCESS);
    }),

    initializeRoles: asyncHandler(async (req, res) => {
        const rolesPath = path.join(__dirname, '../config', 'roles.json');
        const rolesData = JSON.parse(fs.readFileSync(rolesPath, 'utf8'));

        let addedRoles = [];
        let skippedRoles = [];

        for (const { roleName, description } of rolesData) {
            try {
                await roleValidator.checkRoleNameExists(roleName, null);

                const [newRole] = await db.insert(roles).values({
                    roleName,
                    description,
                }).returning();

                addedRoles.push(newRole);
            }
            catch (error) {
                if (error.message.includes(msg.ROLE_EXISTS)) {
                    skippedRoles.push({ roleName, description, reason: error.message });
                    continue;
                }
                throw error;
            }
        }

        sendSuccess(res, { addedRoles, skippedRoles }, msg.ROLES_INIT_SUCCESS);
    }),

    createAdminRole: async () => {
        const [newRole] = await db.insert(roles).values({
            roleName:'Admin',
            description:'',
        }).returning();

        return newRole
    },

    resetSequence: async () => {
        try {
            const query = sql`SELECT setval(pg_get_serial_sequence('roles', 'roleId'), COALESCE((SELECT MAX("roleId") + 1 FROM roles), 1), false)`;
            await db.execute(query);
        } catch (error) {
            throw new Error('Error resetting sequence');
        }
    }
};

export default RoleController;
