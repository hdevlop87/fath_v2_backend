
import UserController from '../controllers/auth/UserController';
import FileController from '../controllers/storage/fileController';
import FolderController from '../controllers/storage/folderController';
import LotController from '../controllers/subdivision/LotController';
import CustomerController from '../controllers/subdivision/CustomerController';
import SaleController from '../controllers/subdivision/SaleController';
import PaymentController from '../controllers/subdivision/PaymentController';
import ExpenseController from '../controllers/subdivision/ExpenseController';
import DashDataController from '../controllers/subdivision/DashDataController';
import SettingController from '../controllers/subdivision/SettingController';


const authRoutes = [
    { path: 'dashData/', method: 'get', handler: DashDataController.getDashData },
    
    { path: 'users/changePassword/:id', method: 'post', handler: UserController.updatePassUser },
    { path: 'users/getRole/:id', method: 'get', handler: UserController.getUserRole },
    { path: 'users/getPermissions/:id', method: 'get', handler: UserController.getUserPermissions },
    { path: 'users', method: 'get', handler: UserController.getAllUsers },
    { path: 'users/email/:email', method: 'get', handler: UserController.getUserByEmail },
    { path: 'users/username/:username', method: 'get', handler: UserController.getUserByUsername },
    { path: 'users/:id', method: 'get', handler: UserController.getUserById },

    { path: 'files/download/:id', method: 'get', handler: FileController.downloadFile },
    { path: 'files/parent/:id', method: 'get', handler: FileController.getFilesByParentId },
    { path: 'files/', method: 'get', handler: FileController.getAllFiles },
    { path: 'files/:id', method: 'get', handler: FileController.getFileById },
    
    { path: 'folders/parent/:id', method: 'get', handler: FolderController.getFoldersByParentId },
    { path: 'folders/', method: 'get', handler: FolderController.getAllFolders },
    { path: 'folders/:id', method: 'get', handler: FolderController.getFolderById },

    { path: 'lots/map', method: 'get', handler: LotController.getLotsMap },
    { path: 'lots/', method: 'get', handler: LotController.getAllLots },
    { path: 'lots/:id', method: 'get', handler: LotController.getLotById },

    { path: 'customers/', method: 'get', handler: CustomerController.getAllCustomers },
    { path: 'customers/:id', method: 'get', handler: CustomerController.getCustomerById },

    { path: 'sales/', method: 'get', handler: SaleController.getAllSales },
    { path: 'sales/:id', method: 'get', handler: SaleController.getSaleById },

    { path: 'payments/', method: 'get', handler: PaymentController.getAllPayments },
    { path: 'payments/sale/:saleId', method: 'get', handler: PaymentController.getPaymentsBySaleId },
    { path: 'payments/:id', method: 'get', handler: PaymentController.getPaymentById },

    { path: 'expenses/', method: 'get', handler: ExpenseController.getAllExpenses },
    { path: 'expenses/:id', method: 'get', handler: ExpenseController.getExpenseById },

    { path: 'settings/', method: 'get', handler: SettingController.getSettings },
];



export default authRoutes;
