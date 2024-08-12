import { sendSuccess, sendError, withErrorHandler } from '../../services/responseHandler';
import { hashPassword, comparePassword, delay } from '../../lib/utils';
import UserValidator from '../../Validators/auth/UserValidator';
import RoleValidator from '../../Validators/auth/RoleValidator';
import TokenService from '../../services/TokenService';
import { msg } from '../../lib/constants/constants';
import UserDb from '../../repositories/UserDb';
import { v4 as uuidv4 } from 'uuid';


const tokenService = new TokenService();
const userValidator = new UserValidator();
const roleValidator = new RoleValidator();

const AuthController = {
    
    loginUser: withErrorHandler(async (req, res) => {
        const { username, password } = req.body;

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
            accessTokenExpiresAt: tokenService.getAccessTokenExpire(),
            refreshTokenExpiresAt: tokenService.getRefreshTokenExpire()
        };

        AuthController.sendCookies(res, refreshToken);
        return sendSuccess(res, data, msg.USER_LOGIN_SUCCESS);
    }),

    registerUser: withErrorHandler(async (req, res) => {
        const { name, username, phone, email, password, roleId, status } = req.body;

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
        };

        const tokenPayload = { userId: userDetails.id };
        const [newUser] = await UserDb.insertUser(userDetails);
        const accessToken = tokenService.generateAccessToken(tokenPayload);
        const refreshToken = tokenService.generateRefreshToken(tokenPayload);
        await tokenService.storeRefrechToken(newUser.id, refreshToken);

        const data = {
            accessToken,
            refreshToken,
            accessTokenExpiresAt: tokenService.getAccessTokenExpire(),
            refreshTokenExpiresAt: tokenService.getRefreshTokenExpire()
        };

        AuthController.sendCookies(res, refreshToken);
        return sendSuccess(res, data, msg.USER_REGISTER_SUCCESS);
    }),

    refreshToken: withErrorHandler(async (req, res) => {
        
        const { accessToken, refreshToken, userId } = await tokenService.refreshToken(req);

        AuthController.sendCookies(res, refreshToken);
        await userValidator.checkUserExists(userId);
        const data = {
            accessToken,
            refreshToken,
            accessTokenExpiresAt: tokenService.getAccessTokenExpire(),
            refreshTokenExpiresAt: tokenService.getRefreshTokenExpire()
        };

        return sendSuccess(res, data, msg.REFRESH_TOKEN_REFRESH_SUCCESS);
    }),

    logoutUser: withErrorHandler(async (req, res) => {
        const userId = req.params.id;
        await userValidator.checkUserExists(userId);
        await tokenService.revokeToken(userId);
        AuthController.clearCookies(res);
        return sendSuccess(res, null, msg.USER_LOGOUT_SUCCESS);
    }),

    userProfile: withErrorHandler(async (req, res) => {
        const user = await tokenService.getUserByAccessToken(req);
        const { roleName } = await UserDb.findRoleById(user.id);
        const permissions = await UserDb.findPermissionsById(user.id);

        const { roleId, password, ...cleanUser } = user;

        const data = {
            ...cleanUser,
            role: roleName,
            permissions
        };
        return sendSuccess(res, data, msg.USER_RETRIEVED_SUCCESS);
    }),

    sendCookies: (res, token, options = {}) => {
        const refreshTokenExpiresAt = tokenService.getRefreshTokenExpire();
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const maxAge = (refreshTokenExpiresAt - nowInSeconds);

        res.cookie('refreshToken', token, {
            httpOnly: true,
            //secure: true,
            sameSite: 'Lax',
            maxAge,
            ...options,
        });

        res.cookie('refreshTokenExpiresAt', refreshTokenExpiresAt.toString(), {
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

};

export default AuthController;
