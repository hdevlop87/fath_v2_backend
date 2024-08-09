import { sendSuccess, sendError, withErrorHandler } from '../../services/responseHandler';
import RoleValidator from '../../Validators/auth/RoleValidator';
import PermissionValidator from '../../Validators/auth/PermissionValidator';
import { msg } from '../../lib/constants/constants';
import RoleDb from '../../repositories/RoleDb';
import PermissionDb from '../../repositories/PermissionDb';
import RolePermissionDb from '../../repositories/RolePermissionDb';

const roleValidator = new RoleValidator();
const permissionValidator = new PermissionValidator();

const RolePermissionController = {

    assignPermissionToRole: withErrorHandler(async (req, res) => {
        const { roleId, permissionId } = req.body;

        await roleValidator.checkRoleExists(roleId);
        await permissionValidator.checkPermissionExists(permissionId);
        await roleValidator.checkPermissionRoleExists(roleId, permissionId);

        const newRolePermission = await RolePermissionDb.assignPermissionToRole(roleId, permissionId);
        return sendSuccess(res, newRolePermission, msg.ROLE_PERMISSION_ASSIGNED_SUCCESS);
    }),

    assignAllPermissionsToAdmin: withErrorHandler(async (req, res) => {
        const adminRoleId = await RoleDb.getAdminRoleId();
        const permissionIds = await PermissionDb.getAllPermissionsIds();
        await RolePermissionDb.assignPermissionsToRole(adminRoleId, permissionIds);
        return sendSuccess(res, null, msg.PERMISSIONS_ASSIGNED_SUCCESS);
    }),

    removePermissionFromRole: withErrorHandler(async (req, res) => {
        const { roleId, permissionId } = req.body;

        await roleValidator.checkRoleExists(roleId);
        await permissionValidator.checkPermissionExists(permissionId);

        const deletedRolePermission = await RolePermissionDb.removePermissionFromRole(roleId, permissionId);

        if (!deletedRolePermission) {
            return sendError(res, msg.ROLE_PERMISSION_NOT_FOUND, 404);
        }

        return sendSuccess(res, deletedRolePermission, msg.ROLE_PERMISSION_REMOVED_SUCCESS);
    }),

    getPermissionsRoleById: withErrorHandler(async (req, res) => {
        const roleId = req.params.id;
        await roleValidator.checkRoleExists(roleId);

        const rolePermissions = await RolePermissionDb.getPermissionsByRoleId(roleId);
        return sendSuccess(res, rolePermissions, msg.ROLE_PERMISSIONS_RETRIEVED_SUCCESS);
    }),

    getPermissionsRoleByName: withErrorHandler(async (req, res) => {
        const roleName = req.params.name;
        await roleValidator.checkRoleNameExists(roleName);

        const rolePermissions = await RolePermissionDb.getPermissionsByRoleName(roleName);
        return sendSuccess(res, rolePermissions, msg.ROLE_PERMISSIONS_RETRIEVED_SUCCESS);
    }),

    

};

export default RolePermissionController;
