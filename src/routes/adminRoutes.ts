import RolePermissionController from '../controllers/auth/RolePermissionController';
import PermissionController from '../controllers/auth/PermissionController';
import UserController from '../controllers/auth/UserController';
import RoleController from '../controllers/auth/RoleController';
import FileController from '../controllers/storage/fileController';
import FolderController from '../controllers/storage/folderController';
import LotController from '../controllers/subdivision/LotController';
import CustomerController from '../controllers/subdivision/CustomerController';
import SaleController from '../controllers/subdivision/SaleController';
import PaymentController from '../controllers/subdivision/PaymentController';
import ExpenseController from '../controllers/subdivision/ExpenseController';
import DocumentController from '../controllers/subdivision/documentController';
import SettingController from '../controllers/subdivision/SettingController';

export const adminOnlyRoutes = [
    { path: 'users/changePassword/:id', method: 'post', handler: UserController.updatePassUser },
    { path: 'users', method: 'delete', handler: UserController.deleteAllUsers },
    { path: 'users', method: 'post', handler: UserController.createUser },
    { path: 'users/:id', method: 'patch', handler: UserController.updateUser },
    { path: 'users/:id', method: 'delete', handler: UserController.deleteUserById },

    { path: 'roles/initialize', method: 'post', handler: RoleController.initializeRoles },
    { path: 'roles/', method: 'get', handler: RoleController.getAllRoles },
    { path: 'roles/', method: 'delete', handler: RoleController.deleteAllRoles },
    { path: 'roles/', method: 'post', handler: RoleController.createRole },
    { path: 'roles/:id', method: 'patch', handler: RoleController.updateRole },
    { path: 'roles/:id', method: 'delete', handler: RoleController.deleteRoleById },
    { path: 'roles/:id', method: 'get', handler: RoleController.getRoleById },

    { path: 'permission/initialize', method: 'post', handler: PermissionController.initializePermissions },
    { path: 'permissions/', method: 'get', handler: PermissionController.getAllPermissions },
    { path: 'permissions/', method: 'delete', handler: PermissionController.deleteAllPermissions },
    { path: 'permissions/', method: 'post', handler: PermissionController.createPermission },
    { path: 'permissions/:id', method: 'get', handler: PermissionController.getPermissionById },
    { path: 'permissions/:id', method: 'patch', handler: PermissionController.updatePermission },
    { path: 'permissions/:id', method: 'delete', handler: PermissionController.deletePermissionById },

    { path: 'rolePermissions/:id', method: 'get', handler: RolePermissionController.getPermissionsRole },
    { path: 'rolePermissions', method: 'post', handler: RolePermissionController.assignPermissionToRole },
    { path: 'rolePermissions', method: 'delete', handler: RolePermissionController.removePermissionFromRole },

    { path: 'settings/', method: 'post', handler: SettingController.getSettings },
];

export const adminAndEditorRoutes = [
    { path: 'files/deleteMulti', method: 'post', handler: FileController.deleteMultiFiles },
    { path: 'files/byPath', method: 'delete', handler: FileController.deleteFileByPath },
    { path: 'files/', method: 'delete', handler: FileController.deleteAllFiles },
    { path: 'files/', method: 'post', handler: FileController.createFile },
    { path: 'files/:id', method: 'patch', handler: FileController.updateFile },
    { path: 'files/:id', method: 'delete', handler: FileController.deleteFileById },

    { path: 'folders/deleteMulti', method: 'post', handler: FolderController.deleteMultiFolders },
    { path: 'folders/', method: 'delete', handler: FolderController.deleteAllFolders },
    { path: 'folders/', method: 'post', handler: FolderController.createFolder },
    { path: 'folders/:id', method: 'patch', handler: FolderController.updateFolder },
    { path: 'folders/:id', method: 'delete', handler: FolderController.deleteFolderById },

    { path: 'lots/bulk-add-csv', method: 'post', handler: LotController.bulkAddLotsFromCSV },
    { path: 'lots/', method: 'delete', handler: LotController.deleteAllLots },
    { path: 'lots/', method: 'post', handler: LotController.createLot },
    { path: 'lots/:id', method: 'patch', handler: LotController.updateLot },
    { path: 'lots/:id', method: 'delete', handler: LotController.deleteLotById },

    { path: 'customers/bulk-add-csv', method: 'post', handler: CustomerController.bulkAddCustomersFromCSV },
    { path: 'customers/', method: 'delete', handler: CustomerController.deleteAllCustomers },
    { path: 'customers/', method: 'post', handler: CustomerController.createCustomer },
    { path: 'customers/:id', method: 'patch', handler: CustomerController.updateCustomer },
    { path: 'customers/:id', method: 'delete', handler: CustomerController.deleteCustomerById },

    { path: 'sales/agreement/email/:id', method: 'post', handler: DocumentController.sendAgreementByMail },
    { path: 'sales/agreement/:id', method: 'get', handler: DocumentController.downloadAgreement },

    { path: 'sales/bulk-add-csv', method: 'post', handler: SaleController.bulkAddSalesFromCSV },
    { path: 'sales/wizard', method: 'post', handler: SaleController.createWizard },
    { path: 'sales/', method: 'delete', handler: SaleController.deleteAllSales },
    { path: 'sales/', method: 'post', handler: SaleController.createSale },
    { path: 'sales/:id', method: 'patch', handler: SaleController.updateSale },
    { path: 'sales/:id', method: 'delete', handler: SaleController.deleteSaleById },

    { path: 'payments/bulk-add-csv', method: 'post', handler: PaymentController.bulkAddPaymentsFromCSV },
    { path: 'payments/', method: 'delete', handler: PaymentController.deleteAllPayments },
    { path: 'payments/', method: 'post', handler: PaymentController.createPayment },
    { path: 'payments/:id', method: 'patch', handler: PaymentController.updatePayment },
    { path: 'payments/:id', method: 'delete', handler: PaymentController.deletePaymentById },

    { path: 'expenses/bulk-add-csv', method: 'post', handler: ExpenseController.bulkAddExpensesFromCSV },
    { path: 'expenses/', method: 'delete', handler: ExpenseController.deleteAllExpenses },
    { path: 'expenses/', method: 'post', handler: ExpenseController.createExpense },
    { path: 'expenses/:id', method: 'patch', handler: ExpenseController.updateExpense },
    { path: 'expenses/:id', method: 'delete', handler: ExpenseController.deleteExpenseById },

];

