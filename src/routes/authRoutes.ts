import RolePermissionController from '../controllers/auth/RolePermissionController';
import PermissionController from '../controllers/auth/PermissionController';
import UserController from '../controllers/auth/UserController';
import RoleController from '../controllers/auth/RoleController';
import SettingController from '../controllers/subdivision/SettingController';
import { hasPermission } from '../middleware';
import {PERMISSIONS} from '../lib/constants/permissions';
import {isAdmin} from '../middleware'

export const authRoutes = [
    // Users routes
    { path: 'users', method: 'get', handler: UserController.getAllUsers, middlewares: [isAdmin] },
    { path: 'users', method: 'post', handler: UserController.bulkAddUsers, middlewares: [isAdmin] },

    // User routes
    { path: 'user', method: 'post', handler: UserController.createUser, middlewares: [isAdmin] },
    { path: 'user/:id', method: 'get', handler: UserController.getUserById, middlewares: [hasPermission(PERMISSIONS.READ_USER)] },
    { path: 'user/:id', method: 'patch', handler: UserController.updateUser, middlewares: [isAdmin] },
    { path: 'user/:id', method: 'delete', handler: UserController.deleteUserById, middlewares: [isAdmin] },

    // Roles routes
    { path: 'roles', method: 'get', handler: RoleController.getAllRoles, middlewares: [isAdmin] },
    { path: 'roles', method: 'post', handler: RoleController.bulkAddRoles, middlewares: [isAdmin] },

    // Role routes
    { path: 'role', method: 'post', handler: RoleController.createRole, middlewares: [isAdmin] },
    { path: 'role/:id', method: 'get', handler: RoleController.getRoleById, middlewares: [isAdmin] },
    { path: 'role/:id', method: 'patch', handler: RoleController.updateRole, middlewares: [isAdmin] },
    { path: 'role/:id', method: 'delete', handler: RoleController.deleteRoleById, middlewares: [isAdmin] },

    // Permissions routes
    { path: 'permissions', method: 'get', handler: PermissionController.getAllPermissions, middlewares: [isAdmin] },
    { path: 'permissions', method: 'post', handler: PermissionController.bulkAddPermissions, middlewares: [isAdmin] },

    // Permission routes
    { path: 'permission', method: 'post', handler: PermissionController.createPermission, middlewares: [isAdmin] },
    { path: 'permission/:id', method: 'get', handler: PermissionController.getPermissionById, middlewares: [isAdmin] },
    { path: 'permission/:id', method: 'patch', handler: PermissionController.updatePermission, middlewares: [isAdmin] },
    { path: 'permission/:id', method: 'delete', handler: PermissionController.deletePermissionById, middlewares: [isAdmin] },

    // Role-Permission routes
    { path: 'rolePermissions/:id', method: 'get', handler: RolePermissionController.getPermissionsRoleById, middlewares: [isAdmin] },
    { path: 'rolePermissions', method: 'post', handler: RolePermissionController.assignPermissionToRole, middlewares: [isAdmin] },
    { path: 'rolePermissions', method: 'delete', handler: RolePermissionController.removePermissionFromRole, middlewares: [isAdmin] },

    // Setting routes
    { path: 'settings', method: 'get', handler: SettingController.getSettings, middlewares: [hasPermission(PERMISSIONS.READ_SETTINGS)] },
    { path: 'settings', method: 'post', handler: SettingController.getSettings, middlewares: [isAdmin] },
];
