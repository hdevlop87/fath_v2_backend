import { eq } from "drizzle-orm";
import { sendSuccess, withErrorHandler } from '../../services/responseHandler';
import RoleValidator from '../../Validators/auth/RoleValidator';
import UserValidator from '../../Validators/auth/UserValidator';
import { hashPassword } from '../../lib/utils';
import { msg } from '../../lib/constants/constants';
import { users } from '../../db/schema';
import { db } from '../../db/index';
import UserDb from '../../repositories/UserDb';
import { v4 as uuidv4 } from 'uuid';

const roleValidator = new RoleValidator();
const userValidator = new UserValidator();

const UserController = {

   getAllUsers: withErrorHandler(async (req, res) => {
      const allUsers = await UserDb.findAllUsers();

      const usersRolePermissions = await Promise.all(allUsers.map(async user => {
         const userRole = await UserDb.findRoleById(user.id);
         const userPermissions = await UserDb.findPermissionsById(user.id);
         const { password, ...cleanUser } = user;
         return {
            ...cleanUser,
            role: userRole.roleName,
            permissions: userPermissions
         };
      }));

      return sendSuccess(res, usersRolePermissions, msg.USERS_RETRIEVED_SUCCESS);
   }),

   deleteAllUsers: withErrorHandler(async (req, res) => {
      const deletedUsers = await UserDb.deleteAllUsers();
      return sendSuccess(res, deletedUsers, msg.USERS_DELETED_SUCCESS);
   }),

   createUser: withErrorHandler(async (req, res) => {
      const { name, username, email, password, roleId, status, image } = req.body;

      await userValidator.validateUserSchema(req.body);
      await userValidator.checkUsernameExists(username);
      await userValidator.checkEmailExists(email);
      await roleValidator.checkRoleExists(roleId);

      const hashedPassword = await hashPassword(password);

      const userDetails = {
         id: uuidv4(),
         name,
         username,
         email,
         password: hashedPassword,
         status,
         roleId,
         image
      };

      const [newUser] = await UserDb.insertUser(userDetails);
      return sendSuccess(res, newUser, msg.USER_CREATED_SUCCESS);
   }),

   updateUser: withErrorHandler(async (req, res) => {
      const userId = req.params.id;
      const updateFields = req.body;

      await userValidator.checkUserExists(userId);

      const validations = {
         username: userValidator.checkUsernameExists,
         email: userValidator.checkEmailExists,
      };

      for (const [field, validationFn] of Object.entries(validations)) {
         if (updateFields.hasOwnProperty(field)) {
            await validationFn(updateFields[field], userId);
         }
      }

      if (updateFields.password) {
         const hashedPassword = await hashPassword(updateFields.password);
         updateFields.password = hashedPassword;
      }

      updateFields.updatedAt = new Date();

      const [updatedUser] = await UserDb.updateUserById(userId, updateFields);

      return sendSuccess(res, updatedUser, msg.USER_UPDATED_SUCCESS);
   }),

   updatePassUser: withErrorHandler(async (req, res) => {
      const userId = req.params.id;
      const { newPassword } = req.body;
      const existingUser = await userValidator.checkUserExists(userId);
      const hashedPassword = await hashPassword(newPassword);

      const [updatedUser] = await db.update(users)
         .set({ password: hashedPassword })
         .where(eq(users.id, existingUser?.id));

      return sendSuccess(res, updatedUser, msg.USER_UPDATED_SUCCESS);
   }),

   updateRoleUser: withErrorHandler(async (req, res) => {
      const { userId, roleId } = req.body;
      await userValidator.checkUserExists(userId);
      await roleValidator.checkRoleExists(roleId);

      const [updatedUser] = await UserDb.updateUserById(userId, { roleId });
      return sendSuccess(res, updatedUser, msg.ROLE_ASSIGNED_TO_USER_SUCCESS);
   }),

   deleteUserById: withErrorHandler(async (req, res) => {
      const userId = req.params.id;
      await userValidator.checkUserExists(userId);
      const [deletedUser] = await UserDb.deleteUserById(userId);
      return sendSuccess(res, deletedUser, msg.USER_DELETED_SUCCESS);
   }),

   getUserById: withErrorHandler(async (req, res) => {
      const userId = req.params.id;
      const user = await userValidator.checkUserExists(userId);
      const role = await UserDb.findRoleById(userId);
      const permissions = await UserDb.findPermissionsById(userId);

      const { roleId, password, ...cleanUser } = user;

      const data = {
         ...cleanUser,
         role,
         permissions
      };
      return sendSuccess(res, data, msg.USER_RETRIEVED_SUCCESS);
   }),

   getUserByEmail: withErrorHandler(async (req, res) => {
      const email = req.params.email;
      const [user] = await UserDb.findUserByEmail(email);
      await userValidator.checkUserExists(user.id);
      return sendSuccess(res, user, msg.USER_RETRIEVED_SUCCESS);
   }),

   getUserByUsername: withErrorHandler(async (req, res) => {
      const username = req.params.username;
      const [user] = await UserDb.findUserByUsername(username);
      await userValidator.checkUserExists(user.id);
      return sendSuccess(res, user, msg.USER_RETRIEVED_SUCCESS);
   }),

   getUserRole: withErrorHandler(async (req, res) => {
      const userId = req.params.id;
      await userValidator.checkUserExists(userId);
      const role = await UserDb.findRoleById(userId);
      return sendSuccess(res, role, msg.USER_ROLES_RETRIEVED_SUCCESS);
   }),

   getUserPermissions: withErrorHandler(async (req, res) => {
      const userId = req.params.id;
      await userValidator.checkUserExists(userId);
      const permissions = await UserDb.findPermissionsById(userId);
      return sendSuccess(res, permissions, msg.USER_PERMISSIONS_RETRIEVED_SUCCESS);
   }),

   bulkAddUsers: withErrorHandler(async (req, res) => {

   }),

   
};

export default UserController;
