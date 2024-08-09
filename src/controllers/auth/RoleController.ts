import { sendSuccess, sendError, withErrorHandler } from '../../services/responseHandler';
import RoleValidator from '../../Validators/auth/RoleValidator';
import { msg } from '../../lib/constants/constants';
import RoleDb from '../../repositories/RoleDb';
import RolePermissionDb from '../../repositories/RolePermissionDb';

const roleValidator = new RoleValidator();

const RoleController = {

    createRole: withErrorHandler(async (req, res) => {
        const details = req.body;
        const { permissions = [] } = details;
        await roleValidator.validateRoleSchema(req.body);
        await roleValidator.checkRoleNameExists(details.roleName);
        
        const newRole = await RoleDb.createRole(details);
        if (permissions.length > 0) {
            await RolePermissionDb.removeAllPermissionsFromRole(newRole.roleId);
            await RolePermissionDb.assignPermissionsToRoleByNames(newRole.roleId, permissions);
        }
        return sendSuccess(res, newRole, msg.ROLE_CREATED_SUCCESS, 201);
    }),

    updateRole: withErrorHandler(async (req, res) => {
        const roleId = req.params.id;
        const details = req.body;
        const { permissions = [] } = details;
        await roleValidator.validateRoleSchema(req.body);
        await roleValidator.checkRoleNameExists(details.roleName, roleId);
        await roleValidator.checkRoleExists(roleId);

        if (permissions.length > 0) {
            await RolePermissionDb.removeAllPermissionsFromRole(roleId);
            await RolePermissionDb.assignPermissionsToRoleByNames(roleId, permissions);
        }

        delete details.permissions;
        const updatedRole = await RoleDb.updateRole(roleId, details);
        return sendSuccess(res, updatedRole, msg.ROLE_UPDATED_SUCCESS);
    }),

    getRoleById: withErrorHandler(async (req, res) => {
        const roleId = req.params.id;
        const role = await roleValidator.checkRoleExists(roleId);
        return sendSuccess(res, role, msg.ROLE_RETRIEVED_SUCCESS);
    }),

    deleteRoleById: withErrorHandler(async (req, res) => {
        const roleId = req.params.id;
        await roleValidator.checkRoleExists(roleId);
        const role = await RoleDb.deleteRoleById(roleId);
        await RoleDb.resetSequence();
        return sendSuccess(res, role, msg.ROLE_DELETED_SUCCESS);
    }),

    getAllRoles: withErrorHandler(async (req, res) => {
        const allRoles = await RoleDb.findAllRoles();
        return sendSuccess(res, allRoles, msg.ROLES_RETRIEVED_SUCCESS);
    }),

    deleteAllRoles: withErrorHandler(async (req, res) => {
        await RoleDb.deleteAllRoles();
        await RoleDb.resetSequence();
        return sendSuccess(res, null, msg.ROLES_DELETED_SUCCESS);
    }),

    bulkAddRoles: withErrorHandler(async (req, res) => {
        const { addedRoles, skippedRoles } = await RoleDb.initializeRoles();
        return sendSuccess(res, { addedRoles, skippedRoles }, msg.ROLES_INIT_SUCCESS);
    }),

    createAdminRole: withErrorHandler(async (req, res) => {
        const newRole = await RoleDb.createAdminRole();
        return sendSuccess(res, newRole, msg.ROLE_CREATED_SUCCESS, 201);
    }),
};

export default RoleController;
