import express from 'express';
import { isAuth, isAdmin, hasRole } from '../middleware';

import {adminOnlyRoutes,adminAndEditorRoutes} from './adminRoutes';
import authRoutes from './authRoutes';
import publicRoutes from './publicRoutes';

const router = express.Router();

const applyRouteGroup = (routes, middlewares = []) => {
    routes.forEach(({ path, method, handler }) => {
        if (router[method]) {
            router[method](`/${path}`, ...middlewares, handler);
        } else {
            console.error(`Method ${method} is not supported for path ${path}.`);
        }
    });
};

applyRouteGroup(publicRoutes);
applyRouteGroup(authRoutes, [isAuth]);
applyRouteGroup(adminOnlyRoutes, [isAdmin]);
applyRouteGroup(adminAndEditorRoutes, [hasRole('Admin', 'Editor')]);


export default router;