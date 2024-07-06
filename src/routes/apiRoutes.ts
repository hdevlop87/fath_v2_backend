import express from 'express';

import { isAuth, isAdmin } from '../middleware'

import adminRoutes from './adminRoutes';
import authRoutes from './authRoutes';
import publicRoutes from './publicRoutes';

const router = express.Router();

const applyRouteGroup = (router, routes, middlewares = []) => {
    routes.forEach(({ path, method, handler }) => {
        if (router[method]) {
            router[method](`/${path}`, ...middlewares, handler);
        } else {
            console.error(`Method ${method} is not supported for path ${path}.`);
        }
    });
};

applyRouteGroup(router, publicRoutes);
applyRouteGroup(router, authRoutes,[isAuth]);
applyRouteGroup(router, adminRoutes,[isAdmin]);


export default router;