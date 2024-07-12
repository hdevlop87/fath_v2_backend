import { eq } from "drizzle-orm";
import { sendSuccess } from '../../services/responseHandler';
import RoleValidator from '../../services/auth/RoleValidator';
import UserValidator from '../../services/auth/UserValidator'
import asyncHandler from '../../lib/asyncHandler'
import { hashPassword } from '../../lib/utils'
import { msg } from '../../lib/constants';
import { users } from '../../db/schema';
import { db } from '../../db/index'
import UserDb from '../../repositories/UserDb';
import {delay} from '../../lib/utils'
import { v4 as uuidv4 } from 'uuid';

const roleValidator = new RoleValidator()
const userValidator = new UserValidator()

const UserController = {

   getAllUsers: asyncHandler(async (req, res) => {
      const allUsers = await UserDb.findAllUsers();

      const usersRolePermissions = await Promise.all(allUsers.map(async user => {
         const userRole = await UserDb.findRoleById(user.id);
         const userPermissions = await UserDb.findPermissionsById(user.id);
         const { password, ...cleanUser } = user
         return {
            ...cleanUser,
            role: userRole.roleName,
            permissions: userPermissions
         };
      }));

      sendSuccess(res, usersRolePermissions, msg.USERS_RETRIEVED_SUCCESS);
   }),

   deleteAllUsers: asyncHandler(async (req, res) => {
      const deletedUsers = await UserDb.deleteAllUsers();
      sendSuccess(res, deletedUsers, msg.USERS_DELETED_SUCCESS);
   }),

   //=============== one user actions =========================//

   createUser: asyncHandler(async (req, res) => {
      const { name, username, email, password, roleId, status,image } = req.body;

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
      }

      const [newUser] = await UserDb.insertUser(userDetails);

      await delay(2000);

      sendSuccess(res, newUser, msg.USER_CREATED_SUCCESS);
   }),

   updateUser: asyncHandler(async (req, res) => {
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

      const [updatedUser] = await UserDb.updateUserById(userId, updateFields)

      sendSuccess(res, updatedUser, msg.USER_UPDATED_SUCCESS);
   }),

   updatePassUser: asyncHandler(async (req, res) => {
      const userId = req.params.id;
      const { newPassword } = req.body;
      const existingUser = await userValidator.checkUserExists(userId);
      const hashedPassword = await hashPassword(newPassword);

      const [updatedUser] = await db.update(users)
         .set({ password: hashedPassword })
         .where(eq(users.id, existingUser?.id));

      sendSuccess(res, updatedUser, msg.USER_DELETED_SUCCESS);
   }),

   updateRoleUser: asyncHandler(async (req, res) => {
      const { userId, roleId } = req.body;
      await userValidator.checkUserExists(userId);
      await roleValidator.checkRoleExists(roleId);

      const [updatedUser] = await UserDb.updateUserById(userId, { roleId });
      sendSuccess(res, updatedUser, msg.ROLE_ASSIGNED_TO_USER_SUCCESS);
   }),

   deleteUserById: asyncHandler(async (req, res) => {
      const userId = req.params.id;
      await userValidator.checkUserExists(userId)
      const [deletedUser] = await UserDb.deleteUserById(userId);
      await delay(2000);
      sendSuccess(res, deletedUser, msg.USER_DELETED_SUCCESS);
   }),

   getUserById: asyncHandler(async (req, res) => {
      const userId = req.params.id;
      const user = await userValidator.checkUserExists(userId)
      const role = await UserDb.findRoleById(userId);
      const permissions = await UserDb.findPermissionsById(userId);

      const { roleId, password, ...cleanUser } = user

      const data = {
         ...cleanUser,
         role,
         permissions
      }
      sendSuccess(res, data, msg.USER_RETRIEVED_SUCCESS);
   }),

   getUserByEmail: asyncHandler(async (req, res) => {
      const email = req.params.email;
      const [user] = await UserDb.findUserByEmail(email);
      await userValidator.checkUserExists(user.id)
      sendSuccess(res, user, msg.USER_RETRIEVED_SUCCESS);
   }),

   getUserByUsername: asyncHandler(async (req, res) => {
      const username = req.params.username;
      const [user] = await UserDb.findUserByUsername(username);
      await userValidator.checkUserExists(user.id)
      sendSuccess(res, user, msg.USER_RETRIEVED_SUCCESS);
   }),

   getUserRole: asyncHandler(async (req, res) => {
      const userId = req.params.id;
      await userValidator.checkUserExists(userId)
      const role = await UserDb.findRoleById(userId);
      sendSuccess(res, role, msg.USER_ROLES_RETRIEVED_SUCCESS);
   }),

   getUserPermissions: asyncHandler(async (req, res) => {
      const userId = req.params.id;
      await userValidator.checkUserExists(userId);
      const permissions = await UserDb.findPermissionsById(userId);
      sendSuccess(res, permissions, msg.USER_PERMISSIONS_RETRIEVED_SUCCESS);
   }),
};


export default UserController