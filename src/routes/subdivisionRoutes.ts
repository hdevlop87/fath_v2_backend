import LotController from '../controllers/subdivision/LotController';
import CustomerController from '../controllers/subdivision/CustomerController';
import SaleController from '../controllers/subdivision/SaleController';
import PaymentController from '../controllers/subdivision/PaymentController';
import ExpenseController from '../controllers/subdivision/ExpenseController';
import DocumentController from '../controllers/subdivision/documentController';
import DashDataController from '../controllers/subdivision/DashDataController';
import {  hasPermission } from '../middleware';
import {PERMISSIONS} from '../lib/constants/permissions'

export const subdivisionRoutes = [
    { path: 'lots/map', method: 'get', handler: LotController.getLotsMap, middlewares: [hasPermission(PERMISSIONS.READ_LOT)] },
    { path: 'lots', method: 'get', handler: LotController.getAllLots, middlewares: [hasPermission(PERMISSIONS.READ_LOT)] },
    { path: 'lots', method: 'post', handler: LotController.bulkAddLotsFromCSV, middlewares: [hasPermission(PERMISSIONS.CREATE_LOT)] },
    { path: 'lot', method: 'post', handler: LotController.createLot, middlewares: [hasPermission(PERMISSIONS.CREATE_LOT)] },
    { path: 'lot/:id', method: 'get', handler: LotController.getLotById, middlewares: [hasPermission(PERMISSIONS.READ_LOT)] },
    { path: 'lot/:id', method: 'patch', handler: LotController.updateLot, middlewares: [hasPermission(PERMISSIONS.UPDATE_LOT)] },
    { path: 'lot/:id', method: 'delete', handler: LotController.deleteLotById, middlewares: [hasPermission(PERMISSIONS.DELETE_LOT)] },

    { path: 'customers', method: 'get', handler: CustomerController.getAllCustomers, middlewares: [hasPermission(PERMISSIONS.READ_CUSTOMER)] },
    { path: 'customers', method: 'post', handler: CustomerController.bulkAddCustomersFromCSV, middlewares: [hasPermission(PERMISSIONS.CREATE_CUSTOMER)] },
    { path: 'customer', method: 'post', handler: CustomerController.createCustomer, middlewares: [hasPermission(PERMISSIONS.CREATE_CUSTOMER)] },
    { path: 'customer/:id', method: 'get', handler: CustomerController.getCustomerById, middlewares: [hasPermission(PERMISSIONS.READ_CUSTOMER)] },
    { path: 'customer/:id', method: 'patch', handler: CustomerController.updateCustomer, middlewares: [hasPermission(PERMISSIONS.UPDATE_CUSTOMER)] },
    { path: 'customer/:id', method: 'delete', handler: CustomerController.deleteCustomerById, middlewares: [hasPermission(PERMISSIONS.DELETE_CUSTOMER)] },

    { path: 'sales', method: 'get', handler: SaleController.getAllSales, middlewares: [hasPermission(PERMISSIONS.READ_SALE)] },
    { path: 'sales', method: 'post', handler: SaleController.bulkAddSalesFromCSV, middlewares: [hasPermission(PERMISSIONS.CREATE_SALE)] },
    { path: 'sale', method: 'post', handler: SaleController.createWizard, middlewares: [hasPermission(PERMISSIONS.CREATE_SALE)] },
    { path: 'sale/:id', method: 'get', handler: SaleController.getSaleById, middlewares: [hasPermission(PERMISSIONS.READ_SALE)] },
    { path: 'sale/:id', method: 'patch', handler: SaleController.updateSale, middlewares: [hasPermission(PERMISSIONS.UPDATE_SALE)] },
    { path: 'sale/:id', method: 'delete', handler: SaleController.deleteSaleById, middlewares: [hasPermission(PERMISSIONS.DELETE_SALE)] },

    { path: 'payments/:saleId', method: 'get', handler: PaymentController.getPaymentsBySaleId, middlewares: [hasPermission(PERMISSIONS.READ_PAYMENT)] },
    { path: 'payments', method: 'get', handler: PaymentController.getAllPayments, middlewares: [hasPermission(PERMISSIONS.READ_PAYMENT)] },
    { path: 'payments', method: 'post', handler: PaymentController.bulkAddPaymentsFromCSV, middlewares: [hasPermission(PERMISSIONS.CREATE_PAYMENT)] },
    { path: 'payment', method: 'post', handler: PaymentController.createPayment, middlewares: [hasPermission(PERMISSIONS.CREATE_PAYMENT)] },
    { path: 'payment/:id', method: 'get', handler: PaymentController.getPaymentById, middlewares: [hasPermission(PERMISSIONS.READ_PAYMENT)] },
    { path: 'payment/:id', method: 'patch', handler: PaymentController.updatePayment, middlewares: [hasPermission(PERMISSIONS.UPDATE_PAYMENT)] },
    { path: 'payment/:id', method: 'delete', handler: PaymentController.deletePaymentById, middlewares: [hasPermission(PERMISSIONS.DELETE_PAYMENT)] },

    { path: 'expenses', method: 'get', handler: ExpenseController.getAllExpenses, middlewares: [hasPermission(PERMISSIONS.READ_EXPENSE)] },
    { path: 'expenses', method: 'post', handler: ExpenseController.bulkAddExpensesFromCSV, middlewares: [hasPermission(PERMISSIONS.CREATE_EXPENSE)] },
    { path: 'expense', method: 'post', handler: ExpenseController.createExpense, middlewares: [hasPermission(PERMISSIONS.CREATE_EXPENSE)] },
    { path: 'expense/:id', method: 'get', handler: ExpenseController.getExpenseById, middlewares: [hasPermission(PERMISSIONS.READ_EXPENSE)] },
    { path: 'expense/:id', method: 'patch', handler: ExpenseController.updateExpense, middlewares: [hasPermission(PERMISSIONS.UPDATE_EXPENSE)] },
    { path: 'expense/:id', method: 'delete', handler: ExpenseController.deleteExpenseById, middlewares: [hasPermission(PERMISSIONS.DELETE_EXPENSE)] },

    { path: 'dashData', method: 'get', handler: DashDataController.getDashData, middlewares: [hasPermission(PERMISSIONS.READ_DASHDATA)] },

    { path: 'agreement/email/:id', method: 'post', handler: DocumentController.sendAgreementByMail, middlewares: [hasPermission(PERMISSIONS.SEND_AGREEMENT)] },
    { path: 'agreement/:id', method: 'get', handler: DocumentController.downloadAgreement, middlewares: [hasPermission(PERMISSIONS.DOWNLOAD_AGREEMENT)] },
];