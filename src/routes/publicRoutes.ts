import AuthController from '../controllers/auth/AuthController';

export const publicRoutes = [

    { path: 'auth/login', method: 'post', handler: AuthController.loginUser },
    { path: 'auth/logout/:id', method: 'post', handler: AuthController.logoutUser },
    { path: 'auth/register', method: 'post', handler: AuthController.registerUser },
    { path: 'auth/refreshToken', method: 'get', handler: AuthController.refreshToken },
    { path: 'auth/me', method: 'get', handler: AuthController.userProfile },
];
