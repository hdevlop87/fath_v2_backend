import express from 'express';
import {authRoutes} from './authRoutes'
import {fileManagerRoutes} from './fileManagerRoutes'
import {subdivisionRoutes} from './subdivisionRoutes'
import {publicRoutes} from './publicRoutes'

const router = express.Router();

const applyRouteGroup = (routes) => {
    routes.forEach(({ path, method, handler, middlewares = [] }) => {
        if (router[method]) {
            router[method](`/${path}`, ...middlewares, handler);
        } else {
            console.error(`Method ${method} is not supported for path ${path}.`);
        }
    });
};

applyRouteGroup(authRoutes);
applyRouteGroup(fileManagerRoutes);
applyRouteGroup(subdivisionRoutes);
applyRouteGroup(publicRoutes);

export default router;