import { sql,eq } from "drizzle-orm";
import { db } from '../db/index';
import { permissions } from '../db/schema'; // Adjust this import to match your permissions schema
import Joi from 'joi';
import { msg } from '../lib/constants';

export default class PermissionValidator {
    static instance = null;
    permissionSchema: Joi.ObjectSchema<any>;

    constructor() {
        if (PermissionValidator.instance) {
            return PermissionValidator.instance;
        }
        this.permissionSchema = Joi.object({
            permissionName: Joi.string().required(),
            description: Joi.string().optional(),
        });
        PermissionValidator.instance = this;
    }

    async validatePermissionSchema(data) {
        try {
            await this.permissionSchema.validateAsync(data);
        } catch (error) {
            if (error instanceof Joi.ValidationError) {
                throw new Error(error.details[0].message);
            } else {
                throw error;
            }
        }
    }

    async checkPermissionExists(permissionId) {
        const [permission] = await db.select().from(permissions).where(eq(permissions.permissionId, permissionId));
        if (!permission) {
            throw new Error(msg.PERMISSION_NOT_FOUND);
        }
        return permission;
    }

    async checkPermissionNameExists(permissionName, permissionId = null) {
        const query = permissionId
            ? sql`${permissions.permissionId} != ${permissionId} AND ${permissions.permissionName} = ${permissionName}`
            : sql`${permissions.permissionName} = ${permissionName}`;

        const existingPermission = await db.select().from(permissions).where(query);
        if (existingPermission.length > 0) {
            throw new Error(msg.PERMISSION_EXISTS);
        } 
    }

    static getInstance() {
        if (!PermissionValidator.instance) {
            PermissionValidator.instance = new PermissionValidator();
        }
        return PermissionValidator.instance;
    }
}
