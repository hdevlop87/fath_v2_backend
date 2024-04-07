import express from 'express';
import RolePermissionController from '../controllers/RolePermissionController';
import PermissionController from '../controllers/PermissionController';
import CustomerController from '../controllers/CustomerController';
import PaymentController from '../controllers/PaymentController';
import authController from '../controllers/AuthController';
import UserController from '../controllers/UserController';
import RoleController from '../controllers/RoleController';
import SaleController from '../controllers/SaleController';
import LotController from '../controllers/LotController';

import { isAuth, isAdmin } from '../middleware'

const router = express.Router();


const adminRoutes = [
    { path: 'users', method: 'get', handler: UserController.getAllUsers },
    { path: 'users', method: 'delete', handler: UserController.deleteAllUsers },
    { path: 'users', method: 'post', handler: UserController.createUser },
    { path: 'users/:id', method: 'get', handler: UserController.getUserById },
    { path: 'users/:id', method: 'patch', handler: UserController.updateUser },
    { path: 'users/:id', method: 'delete', handler: UserController.deleteUserById },

    { path: 'roles/', method: 'get', handler: RoleController.getAllRoles },
    { path: 'roles/', method: 'delete', handler: RoleController.deleteAllRoles },
    { path: 'roles/', method: 'post', handler: RoleController.createRole },
    { path: 'roles/:id', method: 'get', handler: RoleController.getRoleById },
    { path: 'roles/:id', method: 'patch', handler: RoleController.updateRole },
    { path: 'roles/:id', method: 'delete', handler: RoleController.deleteRoleById },
    { path: 'roles/initialize', method: 'post', handler: RoleController.initializeRoles },

    { path: 'permissions/', method: 'get', handler: PermissionController.getAllPermissions },
    { path: 'permissions/', method: 'delete', handler: PermissionController.deleteAllPermissions },
    { path: 'permissions/', method: 'post', handler: PermissionController.createPermission },
    { path: 'permissions/:id', method: 'get', handler: PermissionController.getPermissionById },
    { path: 'permissions/:id', method: 'patch', handler: PermissionController.updatePermission },
    { path: 'permissions/:id', method: 'delete', handler: PermissionController.deletePermissionById },
    { path: 'permission/initialize', method: 'post', handler: PermissionController.initializePermissions },

    { path: 'rolePermissions', method: 'post', handler: RolePermissionController.assignPermissionToRole },
    { path: 'rolePermissions', method: 'delete', handler: RolePermissionController.removePermissionFromRole },
    { path: 'rolePermissions/:id', method: 'get', handler: RolePermissionController.getPermissionsRole },

    { path: 'lots/', method: 'get', handler: LotController.getAllLots },
    { path: 'lots/', method: 'delete', handler: LotController.deleteAllLots },
    { path: 'lots/', method: 'post', handler: LotController.createLot },
    { path: 'lots/:id', method: 'get', handler: LotController.getLotById },
    { path: 'lots/:id', method: 'patch', handler: LotController.updateLot },
    { path: 'lots/:id', method: 'delete', handler: LotController.deleteLotById },
    { path: 'lots/initialize', method: 'post', handler: LotController.initializeLots },

    { path: 'customers/', method: 'get', handler: CustomerController.getAllCustomers },
    { path: 'customers/', method: 'delete', handler: CustomerController.deleteAllCustomers },
    { path: 'customers/', method: 'post', handler: CustomerController.createCustomer },
    { path: 'customers/:id', method: 'get', handler: CustomerController.getCustomerById },
    { path: 'customers/:id', method: 'patch', handler: CustomerController.updateCustomer },
    { path: 'customers/:id', method: 'delete', handler: CustomerController.deleteCustomerById },
    { path: 'customers/initialize', method: 'post', handler: CustomerController.initializeCustomers },

    { path: 'sales/', method: 'get', handler: SaleController.getAllSales },
    { path: 'sales/', method: 'delete', handler: SaleController.deleteAllSales },
    { path: 'sales/', method: 'post', handler: SaleController.createSale },
    { path: 'sales/:id', method: 'get', handler: SaleController.getSaleById },
    { path: 'sales/:id', method: 'patch', handler: SaleController.updateSale },
    { path: 'sales/:id', method: 'delete', handler: SaleController.deleteSaleById },
    { path: 'sales/initialize', method: 'post', handler: SaleController.initializeSales },
    { path: 'sales/wizard', method: 'post', handler: SaleController.createWizard },

    { path: 'payments/', method: 'get', handler: PaymentController.getAllPayments },
    { path: 'payments/', method: 'delete', handler: PaymentController.deleteAllPayments },
    { path: 'payments/', method: 'post', handler: PaymentController.createPayment },
    { path: 'payments/:id', method: 'get', handler: PaymentController.getPaymentById },
    { path: 'payments/:id', method: 'patch', handler: PaymentController.updatePayment },
    { path: 'payments/:id', method: 'delete', handler: PaymentController.deletePaymentById },
    { path: 'payments/initialize', method: 'post', handler: PaymentController.initializePayments },
]

const authRoutes = [
    { path: 'users/changePassword/:id', method: 'post', handler: UserController.updatePassUser },
    { path: 'users/email/:email', method: 'get', handler: UserController.getUserByEmail },
    { path: 'users/username/:username', method: 'get', handler: UserController.getUserByUsername },

    { path: 'users/getRole/:id', method: 'get', handler: UserController.getUserRole },
    { path: 'users/getPermissions/:id', method: 'get', handler: UserController.getUserPermissions },
];

const publicRoutes = [

    { path: 'auth/login', method: 'post', handler: authController.loginUser },
    { path: 'auth/logout/:id', method: 'post', handler: authController.logoutUser },

    // TODO: must assign role guest in register controller, the true role is assigned by admin
    { path: 'auth/register', method: 'post', handler: authController.registerUser },
    { path: 'auth/refreshToken', method: 'get', handler: authController.refreshToken },
    { path: 'auth/me', method: 'get', handler: authController.userProfile },

];

const applyRouteGroup = (router, routes, middlewares = []) => {
    routes.forEach(({ path, method, handler }) => {
        if (router[method]) {
            router[method](`/${path}`, ...middlewares, handler);
        } else {
            console.error(`Method ${method} is not supported for path ${path}.`);
        }
    });
};

applyRouteGroup(router, publicRoutes, [isAdmin]);
applyRouteGroup(router, authRoutes, [isAuth]);
applyRouteGroup(router, adminRoutes);


export default router;