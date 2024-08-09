import TokenService from '../services/TokenService';
import UserValidator from '../Validators/auth/UserValidator';
import { withErrorHandler } from '../services/responseHandler';

const userValidator = new UserValidator();
const tokenService = new TokenService();

export const isAuth = withErrorHandler(async (req, res, next) => {
   req.user = await tokenService.getUserByAccessToken(req);
   next();
});

export const isAdmin = withErrorHandler(async (req, res, next) => {
   const user = await tokenService.getUserByAccessToken(req);
   await userValidator.checkUserHasRole(user.id, ['admin']);
   req.user = user; 
   next();
});

export const hasPermission = (permissionName) => withErrorHandler(async (req, res, next) => {
   const user = await tokenService.getUserByAccessToken(req);
   await userValidator.checkUserHasPermission(user.id, permissionName);
   req.user = user; 
   next();
});

export const hasRole = (...roles) => withErrorHandler(async (req, res, next) => {
   const user = await tokenService.getUserByAccessToken(req);
   await userValidator.checkUserHasRole(user.id, roles);
   req.user = user; 
   next();
});
