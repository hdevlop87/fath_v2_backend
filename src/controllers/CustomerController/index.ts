import { sendSuccess } from '../../services/responseHandler';
import CustomerValidator from '../../services/CustomerValidator';
import asyncHandler from '../../lib/asyncHandler'
import { msg } from '../../lib/constants';
import customerDb from './CustomerDb';
import LotDb from '../LotController/LotDb';
import path from 'path';
import fs from 'fs';

const customerValidator = new CustomerValidator()


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
        await customerValidator.checkPhoneExists(customerDetail.phone);
        await customerValidator.checkEmailExists(customerDetail.email);
        await customerValidator.checkCINExists(customerDetail.CIN);
        customerDetail.customerId = crypto.randomUUID()
        const newCustomer = await customerDb.createCustomer(customerDetail);
        sendSuccess(res, newCustomer, msg.CUSTOMER_CREATED_SUCCESS, 201);
    }),

    updateCustomer: asyncHandler(async (req, res) => {
        const customerId = req.params.id;
        const customerDetails = req.body;

        const validations = {
            customerId: customerValidator.checkCustomerExists,
            phone: customerValidator.checkPhoneExists,
            email: customerValidator.checkEmailExists,
            CIN: customerValidator.checkCINExists,
        };

        for (const [field, validationFn] of Object.entries(validations)) {
            if (customerDetails.hasOwnProperty(field)) {
                await validationFn(customerDetails[field], customerId);
            }
        }

        customerDetails.updatedAt = new Date();

        const updatedCustomer = await customerDb.updateCustomer(customerId, customerDetails);
        sendSuccess(res, updatedCustomer, msg.CUSTOMER_UPDATED_SUCCESS);
    }),

    getCustomerById: asyncHandler(async (req, res) => {
        const customerId = req.params.id;
        const customer = await customerValidator.checkCustomerExists(customerId)
        sendSuccess(res, customer, msg.CUSTOMER_RETRIEVED_SUCCESS);
    }),

    deleteCustomerById: asyncHandler(async (req, res) => {
        const customerId = req.params.id;
        await customerValidator.checkCustomerExists(customerId);
        const customer = await customerDb.deleteCustomerById(customerId);
        await LotDb.setOrphanedLotsAvailable();
        sendSuccess(res, customer, msg.CUSTOMER_DELETED_SUCCESS);
    }),

    initializeCustomers: asyncHandler(async (req, res) => {
        const customersPath = path.join(__dirname, '../config', 'customers.json');
        const customersData = JSON.parse(fs.readFileSync(customersPath, 'utf8'));

        let addedCustomers = [];
        let skippedCustomers = [];

        for (const customer of customersData) {
            try {
                await customerValidator.validateCustomerSchema(customer);
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



