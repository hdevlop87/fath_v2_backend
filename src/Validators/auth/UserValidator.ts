import { sql,eq } from "drizzle-orm";
import { db } from '../../db/index';
import { users } from '../../db/schema';
import Joi from 'joi';
import { msg } from '../../lib/constants/constants';
import UserDb from '../../repositories/UserDb'

export default class UserValidator {
    static instance = null;
    userSchema: Joi.ObjectSchema<any>;

    constructor() {

        if (UserValidator.instance) {
            return UserValidator.instance;
        }

        this.userSchema = Joi.object({
            name: Joi.string().required(),
            username: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().required(),
            roleId: Joi.number().optional(),
            image: Joi.string().optional(),
            file: Joi.any().optional(),
            emailVerified: Joi.boolean().optional(),
            status: Joi.string().optional(),
        });

        UserValidator.instance = this;
    }

    async validateUserSchema(data) {
        try {
            await this.userSchema.validateAsync(data);
        }
        catch (error) {
            if (error instanceof Joi.ValidationError) {
                throw new Error(error.details[0].message);
            } else {
                throw error;
            }
        }
    }

    async checkIsAdmin(userId) {
        await this.checkUserHasRole(userId, ['admin']);
    }

    async checkIsGuest(userId) {
        await this.checkUserHasRole(userId, ['guest']);
    }

    async checkUserHasRole(userId, roleNames) {
        const role = await UserDb.findRoleById(userId);
        if (!role) {
            throw new Error(msg.ACCESS_DENIED);
        }
        const hasRole = roleNames.some(roleName => role.roleName.toLowerCase() === roleName.toLowerCase());
        if (!hasRole) {
            throw new Error(msg.ACCESS_DENIED);
        }
        return true;
    }

    async checkUserHasPermission(userId, permissionName) {
        await this.checkUserExists(userId);
        const permissions = await UserDb.findPermissionsById(userId);
        const hasPermission = permissions.some(permission => permission.toLowerCase() === permissionName.toLowerCase());
        
        if (!hasPermission) {
            throw new Error(msg.ACCESS_DENIED);
        }
    }

    async checkUserExists(userId) {
        const user = await UserDb.findUserById(userId);
        if (!user) {
            throw new Error(msg.USER_NOT_FOUND);
        }
        return user;
    }

    async checkUsernameExists(username, userId = null) {
        if (!username) { 
            throw new Error(msg.USERNAME_MISSING);
        }
        const query = userId
            ? sql`${users.id} != ${userId} AND ${users.username} = ${username}`
            : sql`${users.username} = ${username}`;

        const [existingUser] = await db.select().from(users).where(query);

        if (existingUser) {
            throw new Error(msg.USERNAME_EXISTS);
        }

        return existingUser
    }

    async checkEmailExists(email, userId = null) {
        if (!email) { 
            throw new Error(msg.EMAIL_MISSING);
        }
        const query = userId
            ? sql`${users.id} != ${userId} AND ${users.email} = ${email}`
            : sql`${users.email} = ${email}`;

        const [existingUser] = await db.select().from(users).where(query);
        if (existingUser) {
            throw new Error(msg.USERNAME_EXISTS);
        }

        return existingUser
    }

    static getInstance() {
        if (!UserValidator.instance) {
            UserValidator.instance = new UserValidator();
        }
        return UserValidator.instance;
    }
}