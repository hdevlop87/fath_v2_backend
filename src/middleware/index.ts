import TokenService from '../services/auth/TokenService';
import UserValidator from '../services/auth/UserValidator';
import asyncHandler from '../lib/asyncHandler';

const userValidator = new UserValidator();
const tokenService = new TokenService();

export const isAuth = asyncHandler(async (req, res, next) => {
   req.user = await tokenService.getUserByAccessToken(req);
   next();
});

export const isAdmin = asyncHandler(async (req, res, next) => {
   const user = await tokenService.getUserByAccessToken(req);
   await userValidator.checkUserHasRole(user.id, ['admin']);
   next();
});

export const hasPermission = (permissionName) => asyncHandler(async (req, res, next) => {
   const user = await tokenService.getUserByAccessToken(req);
   await userValidator.checkUserHasPermission(user.id, permissionName);
   next();
});

export const hasRole = (...roles) => asyncHandler(async (req, res, next) => {
   const user = await tokenService.getUserByAccessToken(req);
   await userValidator.checkUserHasRole(user.id, roles);
   next();
});
