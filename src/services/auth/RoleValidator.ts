import { eq, sql, and } from "drizzle-orm";
import { db } from '../../db/index';
import { roles,rolesPermissions } from '../../db/schema';
import Joi from 'joi';
import { msg } from '../../lib/constants';


export default class RoleValidator {

    static instance = null;
    roleSchema: Joi.ObjectSchema<any>;
    userRoleSchema: Joi.ObjectSchema<any>;

    constructor() {
        if (RoleValidator.instance) {
            return RoleValidator.instance;
        }
        this.roleSchema = Joi.object({
            roleName: Joi.string().required(),
            description: Joi.string().optional(),
        });
        this.userRoleSchema = Joi.object({
            userId: Joi.string().required(),
            roleId: Joi.number().required(),
        });
        RoleValidator.instance = this;
    }

    async validateUserRoleSchema(data) {
        try {
            await this.userRoleSchema.validateAsync(data);
        }
        catch (error) {
            if (error instanceof Joi.ValidationError) {
                throw new Error(error.details[0].message);
            } else {
                throw error;
            }
        }
    }

    async validateRoleSchema(data) {
        try {
            await this.roleSchema.validateAsync(data);
        }
        catch (error) {
            if (error instanceof Joi.ValidationError) {
                throw new Error(error.details[0].message);
            } else {
                throw error;
            }
        }
    }

    async checkRoleExists(roleId) {
        const [role] = await db.select().from(roles).where(eq(roles.roleId, roleId));
        if (!role) {
            throw new Error(msg.ROLE_NOT_FOUND);
        }
        return role;
    }

    async checkRoleNameExists(roleName, roleId = null) {
        const query = roleId
            ? sql`${roles.roleId} != ${roleId} AND ${roles.roleName} = ${roleName}`
            : sql`${roles.roleName} = ${roleName}`;

        const existingRole = await db.select().from(roles).where(query);
        if (existingRole.length > 0) {
            throw new Error(msg.ROLE_EXISTS);
        }
        return existingRole.length > 0 ? existingRole[0] : null;
    }

    async checkPermissionRoleExists(permissionId, roleId) {
        const [permissionRole] = await db.select().from(rolesPermissions)
            .where(and(eq(rolesPermissions.permissionId, permissionId), eq(rolesPermissions.roleId, roleId)))
        if (permissionRole) {
            throw new Error(msg.ROLE_PERMISSION_EXISTS); 
        }
    }

    async findRoleByName(roleName) {
        const existingRole = await db.select().from(roles).where(eq(roles.roleName, roleName));
        return existingRole.length > 0 ? existingRole[0] : null;
    }

    static getInstance() {
        if (!RoleValidator.instance) {
            RoleValidator.instance = new RoleValidator();
        }
        return RoleValidator.instance;
    }
}