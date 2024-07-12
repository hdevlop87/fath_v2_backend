import { sendSuccess, sendError } from '../../services/responseHandler';
import CustomerValidator from '../../services/subdivision/CustomerValidator';
import customerDb from '../../repositories/CustomerDb';
import asyncHandler from '../../lib/asyncHandler';
import { parseCSVFile } from '../../lib/utils';
import LotDb from '../../repositories/LotDb';
import FolderDb from '../../repositories/folderDb';
import { msg } from '../../lib/constants';
import FolderController from '../storage/folderController'
import StorageManager from '../../services/storage/StorageManager'
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

const customerValidator = new CustomerValidator()
const storageManager = new StorageManager()
const parentFolderId = "77777777-7777-7777-7777-777777777777";

const CustomerController = {
    //===================== many customers actions ======================//
    getAllCustomers: asyncHandler(async (req, res) => {
        const allCustomers = await customerDb.findAllCustomers();
        sendSuccess(res, allCustomers, msg.CUSTOMERS_RETRIEVED_SUCCESS);
    }),

    deleteAllCustomers: asyncHandler(async (req, res) => {
        await customerDb.deleteAllCustomers();
        await LotDb.setOrphanedLotsAvailable();
        sendSuccess(res, null, msg.CUSTOMERS_DELETED_SUCCESS);
    }),
    //===============================================================//

    createCustomer: asyncHandler(async (req, res) => {

        const customerDetail = req.body;
        await customerValidator.validateCustomerSchema(customerDetail);
        await customerValidator.checkEmailExists(customerDetail.email);
        await customerValidator.checkCINExists(customerDetail.CIN);
        await customerValidator.checkPhoneExists(customerDetail.phone);
        customerDetail.customerId = uuidv4();
        const customerName = customerDetail.firstName + '_' + customerDetail.lastName
        
        const folderPath = path.join(await storageManager.getFolderPath(parentFolderId), customerName);
        const canCreateFolder = ! await FolderDb.folderExistsByPath(folderPath);
        
        if (canCreateFolder) {
            await fs.mkdir(folderPath, { recursive: true });
            await FolderDb.insertFolder({
                id: customerDetail.customerId,
                parentId: parentFolderId,
                name: customerName,
                path: await storageManager.getRelativePath(folderPath)
            });
        }

        const newCustomer = await customerDb.createCustomer(customerDetail);
        sendSuccess(res, newCustomer, msg.CUSTOMER_CREATED_SUCCESS, 201);
    }),

    updateCustomer: asyncHandler(async (req, res) => {
        const customerId = req.params.id;
        const customerDetails = req.body;

        await customerValidator.checkCustomerExists(customerId);
        await customerValidator.checkPhoneExists(customerDetails.phone, customerId);
        await customerValidator.checkEmailExists(customerDetails.email, customerId);
        await customerValidator.checkCINExists(customerDetails.CIN, customerId);
        customerDetails.updatedAt = new Date();

        const updatedCustomer = await customerDb.updateCustomer(customerId, customerDetails);
        sendSuccess(res, updatedCustomer, msg.CUSTOMER_UPDATED_SUCCESS);
    }),

    getCustomerById: asyncHandler(async (req, res) => {
        const customerId = req.params.id;
        const customer = await customerValidator.checkCustomerExists(customerId);
        sendSuccess(res, customer, msg.CUSTOMER_RETRIEVED_SUCCESS);
    }),

    deleteCustomerById: asyncHandler(async (req, res) => {
        const customerId = req.params.id;
        await customerValidator.checkCustomerExists(customerId);
        const customer = await customerDb.deleteCustomerById(customerId);

        const customerName = customer.firstName + '_' + customer.lastName;
        const folderPath = path.join(await storageManager.getFolderPath(parentFolderId), customerName);

        const folder = await FolderDb.findFolderByPath(folderPath);
        if (folder) {
            await fs.mkdir(folderPath, { recursive: true });
            await FolderDb.deleteFolderById(folder.id);
        }

        await LotDb.setOrphanedLotsAvailable();
        sendSuccess(res, customer, msg.CUSTOMER_DELETED_SUCCESS);
    }),

    bulkAddCustomersFromCSV: asyncHandler(async (req, res) => {
        const filePath = req.body.path;
        const customersData: any = await parseCSVFile(filePath);

        let addedCustomers = [];
        let skippedCustomers = [];

        for (const customer of customersData) {
            try {
                await customerValidator.validateCustomerSchema(customer);
                await customerValidator.checkPhoneExists(customer.phone);
                await customerValidator.checkEmailExists(customer.email);
                await customerValidator.checkCINExists(customer.CIN);
                const newCustomer = await customerDb.createCustomer(customer);
                addedCustomers.push(newCustomer);
            }
            catch (error) {
                if (error.message.includes(msg.CUSTOMER_EXISTS)) {
                    skippedCustomers.push({ customer, reason: error.message });
                    continue;
                }
                throw error;
            }
        }

        sendSuccess(res, { addedCustomers, skippedCustomers }, msg.CUSTOMERS_INIT_SUCCESS);
    }),

};

export default CustomerController;



