import { sendSuccess, sendError, withErrorHandler } from '../../services/responseHandler';
import PermissionValidator from '../../Validators/auth/PermissionValidator';
import RoleValidator from '../../Validators/auth/RoleValidator';
import { msg } from '../../lib/constants/constants';
import PermissionDb from '../../repositories/PermissionDb';

const permissionValidator = new PermissionValidator();
const roleValidator = new RoleValidator();

const PermissionController = {
    getAllPermissions: withErrorHandler(async (req, res) => {
        const allPermissions = await PermissionDb.getAllPermissions();
        return sendSuccess(res, allPermissions, msg.PERMISSIONS_RETRIEVED_SUCCESS);
    }),

    deleteAllPermissions: withErrorHandler(async (req, res) => {
        await PermissionDb.deleteAllPermissions();
        await PermissionDb.resetPermissionSequence();
        return sendSuccess(res, null, msg.PERMISSIONS_DELETED_SUCCESS);
    }),

    createPermission: withErrorHandler(async (req, res) => {
        const details = req.body;

        await permissionValidator.validatePermissionSchema(req.body);
        await permissionValidator.checkPermissionNameExists(details.permissionName);

        const newPermission = await PermissionDb.createPermission(details);
        return sendSuccess(res, newPermission, msg.PERMISSION_CREATED_SUCCESS, 201);
    }),

    updatePermission: withErrorHandler(async (req, res) => {
        const permissionId = req.params.id;
        const { permissionName, description } = req.body;

        const existingPermission = await permissionValidator.checkPermissionExists(permissionId);
        await permissionValidator.checkPermissionNameExists(permissionName, permissionId);

        const updatedFields = {
            permissionName: permissionName || existingPermission.permissionName,
            description: description || existingPermission.description,
        };

        const updatedPermission = await PermissionDb.updatePermission(permissionId, updatedFields);
        return sendSuccess(res, updatedPermission, msg.PERMISSION_UPDATED_SUCCESS);
    }),

    getPermissionById: withErrorHandler(async (req, res) => {
        const permissionId = req.params.id;
        const permission = await PermissionDb.findPermissionById(permissionId);

        if (!permission) {
            return sendError(res, msg.PERMISSION_NOT_FOUND, 404);
        }

        return sendSuccess(res, permission, msg.PERMISSION_RETRIEVED_SUCCESS);
    }),

    deletePermissionById: withErrorHandler(async (req, res) => {
        const permissionId = req.params.id;
        await permissionValidator.checkPermissionExists(permissionId);

        const deletedPermission = await PermissionDb.deletePermissionById(permissionId);
        await PermissionDb.resetPermissionSequence();
        return sendSuccess(res, deletedPermission, msg.PERMISSION_DELETED_SUCCESS);
    }),

    bulkAddPermissions: withErrorHandler(async (req, res) => {
        const { addedPermissions, skippedPermissions } = await PermissionDb.initializePermissions();
        return sendSuccess(res, { addedPermissions, skippedPermissions }, msg.PERMISSIONS_INIT_SUCCESS);
    })
};

export default PermissionController;
