import CustomerValidator from '../../Validators/subdivision/CustomerValidator';
import PaymentValidator from '../../Validators/subdivision/PaymentValidator';
import { sendSuccess, sendError, withErrorHandler } from '../../services/responseHandler';
import SaleValidator from '../../Validators/subdivision/SaleValidator';
import LotValidator from '../../Validators/subdivision/LotValidator';
import customerDb from '../../repositories/CustomerDb';
import paymentDb from '../../repositories/PaymentDb';

import { parseCSVFile } from '../../lib/utils';
import saleDb from '../../repositories/SaleDb';
import lotDb from '../../repositories/LotDb';
import { msg } from '../../lib/constants/constants';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const saleValidator = new SaleValidator();
const lotValidator = new LotValidator();
const customerValidator = new CustomerValidator();
const paymentValidator = new PaymentValidator();

const SaleController = {
    //===================== many sales actions ======================//
    getAllSales: withErrorHandler(async (req, res) => {
        const allSales = await saleDb.findAllSales();
        return sendSuccess(res, allSales, msg.SALES_RETRIEVED_SUCCESS);
    }),

    deleteAllSales: withErrorHandler(async (req, res) => {
        await saleDb.deleteAllSales();
        await saleDb.resetSequence();
        await lotDb.setOrphanedLotsAvailable();
        return sendSuccess(res, null, msg.SALES_DELETED_SUCCESS);
    }),
    //===============================================================//

    createSale: withErrorHandler(async (req, res) => {
        const { lotId, customerId } = req.body;
        const saleDetail = req.body;
        await saleValidator.validateSaleSchema(saleDetail);
        await saleValidator.checkLotExistsInSales(lotId)
        await lotValidator.checkLotExists(lotId);
        await lotValidator.checkLotAvailability(lotId);
        await customerValidator.checkCustomerExists(customerId);

        const size = await lotDb.getLotSize(lotId);
        const pricePerM2 = await lotDb.getLotPricePerM2(lotId);

        saleDetail.totalPrice = parseFloat(pricePerM2) * parseFloat(size);
        saleDetail.balanceDue = saleDetail.totalPrice;
        saleDetail.paidPercentage = "0";
        saleDetail.status = msg.INITIATED;

        await lotDb.updateLotStatus(lotId, msg.RESERVED);
        const newSale = await saleDb.createSale(saleDetail);
        return sendSuccess(res, newSale, msg.SALE_CREATED_SUCCESS, 201);
    }),

    createWizard: withErrorHandler(async (req, res) => {
        const { customer, sale, payment } = req.body;

        

        //=== step1:create customer or return exists one
        let newCustomer
        await customerValidator.validateCustomerSchema(customer);
        try {
            await customerValidator.checkCINExists(customer.CIN);
            await customerValidator.checkPhoneExists(customer.phone);
            customer.customerId = uuidv4()
            newCustomer = await customerDb.createCustomer(customer);
        } 
        catch (error) {
            if (error.message == msg.CIN_EXISTS) {
                newCustomer = await customerDb.findCustomerByCIN(customer.CIN);
            } 
            else if (error.message == msg.PHONE_EXISTS) {  
                newCustomer = await customerDb.findCustomerByPhone(customer.phone);
            } 
            else {
                throw error;
            }
        }

        //=== step1:check lot availability
        const lotId = await lotDb.getLotIdByRef(sale.lotRef);
        await lotValidator.checkLotExists(lotId);
        await lotValidator.checkLotAvailability(lotId);

        //=== step2: create sale
        const pricePerM2 = sale.pricePerM2;
        const size = await lotDb.getLotSize(lotId);
        sale.totalPrice = parseFloat(pricePerM2) * parseFloat(size);
        sale.customerId = newCustomer.customerId;
        sale.lotId = lotId
        const newSale = await saleDb.createSale(sale);

        //=== step1:check and create payment
        payment.saleId = newSale.saleId
        await paymentValidator.validatePaymentSchema(payment);
        await paymentValidator.checkReceiptUnique(payment.receipt);

        if (paymentValidator.isReceiptProvided(payment.receipt)) {
            payment.status = msg.VERIFIED;
        }

        const newPayment = await paymentDb.createPayment(payment);

        
        await lotDb.updateLotStatus(lotId, msg.RESERVED);
        await lotDb.updateLotPricePerM2(lotId, pricePerM2);
        await saleDb.updateSaleOnPayment(newSale.saleId);

        return sendSuccess(res, { newCustomer, sale, newPayment }, msg.SALE_CREATED_SUCCESS, 201);
    }),

    updateSale: withErrorHandler(async (req, res) => {
        const saleId = req.params.id;
        const { lotRef, customerId, pricePerM2, date, isActif } = req.body;

        const sale = await saleValidator.checkSaleExists(saleId);
        const lotId = await lotDb.getLotIdByRef(lotRef);

        if (lotId && (lotId !== sale.lotId)) {
            await saleValidator.checkLotExistsInSales(lotId, saleId);
            await lotValidator.checkLotExists(lotId);
            await lotValidator.checkLotAvailability(lotId);
        }

        if (customerId) {
            await customerValidator.checkCustomerExists(customerId);
        }

        const lotSize: any = await lotDb.getLotSize(lotId);
        const totalPrice = pricePerM2 ? lotSize * parseFloat(pricePerM2) : sale.totalPrice;

        const saleDetails = {
            saleId,
            lotId,
            customerId,
            totalPrice,
            totalVerifiedPayments: sale.totalVerifiedPayments,
            balanceDue: sale.balanceDue,
            paidPercentage: sale.paidPercentage,
            date,
            status: isActif === false ? msg.CANCELED : sale.status,
            updatedAt: new Date(),
            createdAt: sale.createdAt,
        };

        const updatedSale = await saleDb.updateSale(saleId, saleDetails);

        if (isActif !== false) {
            await saleDb.updateSaleOnPayment(saleId);
        }
        await lotDb.updateLotPricePerM2(lotId, pricePerM2);
        await lotDb.setOrphanedLotsAvailable();
        return sendSuccess(res, updatedSale, msg.SALE_UPDATED_SUCCESS);
    }),

    getSaleById: withErrorHandler(async (req, res) => {
        const saleId = req.params.id;
        const sale = await saleValidator.checkSaleExists(saleId)
        return sendSuccess(res, sale, msg.SALE_RETRIEVED_SUCCESS);
    }),

    deleteSaleById: withErrorHandler(async (req, res) => {
        const saleId = req.params.id;
        await saleValidator.checkSaleExists(saleId);
        const sale = await saleDb.deleteSaleById(saleId);
        await lotDb.setOrphanedLotsAvailable();
        await saleDb.resetSequence();
        return sendSuccess(res, sale, msg.SALE_DELETED_SUCCESS);
    }),

    initializeSales: withErrorHandler(async (req, res) => {
        const salesPath = path.join(__dirname, '../config', 'sales.json');
        const salesData = JSON.parse(fs.readFileSync(salesPath, 'utf8'));

        let addedSales = [];
        let skippedSales = [];

        for (const sale of salesData) {
            try {
                await saleValidator.validateSaleSchema(sale);
                const newSale = await saleDb.createSale(sale);
                addedSales.push(newSale);
            }
            catch (error) {
                if (error.message.includes(msg.SALE_EXISTS)) {
                    skippedSales.push({ sale, reason: error.message });
                    continue;
                }
                throw error;
            }
        }

        return sendSuccess(res, { addedSales, skippedSales }, msg.SALES_INIT_SUCCESS);
    }),

    bulkAddSalesFromCSV: withErrorHandler(async (req, res) => {
        const filePath = req.body.path;

        if (!filePath || !fs.existsSync(filePath)) {
            return sendError(res, 'Invalid or missing file path', 400);
        }

        const salesData: any = await parseCSVFile(filePath);

        let addedSales = [];
        let skippedSales = [];

        for (const sale of salesData) {
            try {
                await saleValidator.validateSaleSchema(sale);
                const newSale = await saleDb.createSale(sale);
                addedSales.push(newSale);
            }
            catch (error) {
                if (error.message.includes(msg.SALE_EXISTS)) {
                    skippedSales.push({ sale, reason: error.message });
                    continue;
                }
                throw error;
            }
        }

        return sendSuccess(res, { addedSales, skippedSales }, msg.SALES_INIT_SUCCESS);
    }),
};

export default SaleController;



