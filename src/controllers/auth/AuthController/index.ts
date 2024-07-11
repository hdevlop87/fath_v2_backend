import { sendSuccess, sendError } from '../../../services/responseHandler';
import { hashPassword, comparePassword } from '../../../lib/utils';
import UserValidator from '../../../services/auth/UserValidator';
import RoleValidator from '../../../services/auth/RoleValidator';
import TokenService from '../../../services/auth/TokenService';
import asyncHandler from '../../../lib/asyncHandler';
import { msg } from '../../../lib/constants';
import UserDb from '../../auth/UserController/UserDb';

const tokenService = new TokenService()
const userValidator = new UserValidator()
const roleValidator = new RoleValidator()

const AuthController = {

    loginUser: asyncHandler(async (req, res) => {
        let { username, password } = req.body;

        if (!username || !password) {
            return sendError(res, msg.FIELDS_MISSING, 400);
        }

        const [user] = await UserDb.findUserByUsername(username);
        const isPasswordValid = await comparePassword(password, user?.password);

        if (!user || !isPasswordValid) {
            return sendError(res, msg.INVALID_CREDENTIALS, 401);
        }

        const tokenPayload = { userId: user.id };

        const accessToken = tokenService.generateAccessToken(tokenPayload);
        const refreshToken = tokenService.generateRefreshToken(tokenPayload);
        await tokenService.storeRefrechToken(user.id, refreshToken);

        const data = {
            accessToken,
            refreshToken,
            accessTokenExpiresAt: AuthController.getAccessTokenExpire(),
            refreshTokenExpiresAt: AuthController.getRefreshTokenExpire()
        }

        AuthController.sendCookies(res, refreshToken);
        sendSuccess(res, data, msg.USER_LOGIN_SUCCESS);
    }),

    registerUser: asyncHandler(async (req, res) => {
        const { name, username, phone, email, password, roleId,status } = req.body;

        await userValidator.validateUserSchema(req.body);
        await userValidator.checkUsernameExists(username);
        await userValidator.checkEmailExists(email);
        await roleValidator.checkRoleExists(roleId);

        const hashedPassword = await hashPassword(password);

        const userDetails = {
            id: crypto.randomUUID(),
            name,
            username,
            email,
            password: hashedPassword,
            status,
            roleId,
        }
        
        const tokenPayload = { userId: userDetails.id };
        const [newUser] = await UserDb.insertUser(userDetails);
        const accessToken = tokenService.generateAccessToken(tokenPayload);
        const refreshToken = tokenService.generateRefreshToken(tokenPayload);
        tokenService.storeRefrechToken(newUser.id, refreshToken);

        const data = {
            accessToken,
            refreshToken,
            accessTokenExpiresAt: AuthController.getAccessTokenExpire(),
            refreshTokenExpiresAt: AuthController.getRefreshTokenExpire()
        }

        AuthController.sendCookies(res, refreshToken);
        sendSuccess(res, data, msg.USER_REGISTER_SUCCESS);
    }),

    refreshToken: asyncHandler(async (req, res) => {

        let { accessToken, refreshToken, userId } = await tokenService.refreshToken(req);

        AuthController.sendCookies(res, refreshToken);
        await userValidator.checkUserExists(userId);
        const data = {
            accessToken,
            refreshToken,
            accessTokenExpiresAt: AuthController.getAccessTokenExpire(),
            refreshTokenExpiresAt: AuthController.getRefreshTokenExpire()
        }
        sendSuccess(res, data, msg.REFRESH_TOKEN_REFRESH_SUCCESS);
    }),

    logoutUser: asyncHandler(async (req, res) => {
        const userId = req.params.id;
        await userValidator.checkUserExists(userId)
        await tokenService.revokeToken(userId);
        AuthController.clearCookies(res);
        sendSuccess(res, null, msg.USER_LOGOUT_SUCCESS);
    }),

    userProfile: asyncHandler(async (req, res) => {
        const user = await tokenService.getUserByAccessToken(req);
        const {roleName} = await UserDb.findRoleById(user.id);
        const permissions = await UserDb.findPermissionsById(user.id);
  
        const { roleId, password, ...cleanUser } = user
  
        const data = {
           ...cleanUser,
           role:roleName,
           permissions
        }
        sendSuccess(res, data, msg.USER_RETRIEVED_SUCCESS);
    }),


    sendCookies: (res, token, options = {}) => {

        const refreshTokenExpiresAt = AuthController.getRefreshTokenExpire();
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const maxAge = (refreshTokenExpiresAt - nowInSeconds) * 1000;

        res.cookie('refreshToken', token, {
            httpOnly: true,
            //secure: true,
            sameSite: 'Lax',
            maxAge,
            ...options,
        });

        res.cookie('refreshTokenExpiresAt', refreshTokenExpiresAt, {
            //secure: true,
            sameSite: 'Lax',
            maxAge,
            ...options,
        });
    },

    clearCookies: (res, options = {}) => {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            //secure: true,
            sameSite: 'Lax',
            ...options,
        });

        res.clearCookie('refreshTokenExpiresAt', {
            //secure: true,
            sameSite: 'Lax',
            ...options
        });
    },

    getAccessTokenExpire: () => {
        const expireDate = tokenService.getAccessTokenExpire();
        return Math.floor(expireDate.getTime() / 1000);
    },

    getRefreshTokenExpire: () => {
        const expireDate = tokenService.getRefreshTokenExpire();
        return Math.floor(expireDate.getTime() / 1000);
    },


}

export default AuthController;