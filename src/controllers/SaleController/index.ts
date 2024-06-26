import CustomerValidator from '../../services/CustomerValidator';
import PaymentValidator from '../../services/PaymentValidator';
import { sendSuccess } from '../../services/responseHandler';
import customerDb from '../CustomerController/CustomerDb';
import paymentDb from '../PaymentController/PaymentDb';
import SaleValidator from '../../services/SaleValidator';
import LotValidator from '../../services/LotValidator';
import asyncHandler from '../../lib/asyncHandler'
import { msg } from '../../lib/constants';
import lotDb from '../LotController/LotDb';
import saleDb from './SaleDb';

import path from 'path';
import fs from 'fs';

const saleValidator = new SaleValidator();
const lotValidator = new LotValidator();
const customerValidator = new CustomerValidator();
const paymentValidator = new PaymentValidator();

const SaleController = {
    //===================== many sales actions ======================//
    getAllSales: asyncHandler(async (req, res) => {
        const allSales = await saleDb.findAllSales();
        sendSuccess(res, allSales, msg.SALES_RETRIEVED_SUCCESS);
    }),

    deleteAllSales: asyncHandler(async (req, res) => {
        await saleDb.deleteAllSales();
        await saleDb.resetSequence();
        await lotDb.setOrphanedLotsAvailable();
        sendSuccess(res, null, msg.SALES_DELETED_SUCCESS);
    }),
    //===============================================================//

    createSale: asyncHandler(async (req, res) => {
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
        sendSuccess(res, newSale, msg.SALE_CREATED_SUCCESS, 201);
    }),

    createWizard: asyncHandler(async (req, res) => {
        const { customer, sale, payment } = req.body;

        //=== step1:create customer or return exists one
        let newCustomer
        await customerValidator.validateCustomerSchema(customer);
        try {
            await customerValidator.checkCINExists(customer.CIN);
            customer.customerId = crypto.randomUUID()
            newCustomer = await customerDb.createCustomer(customer);
        }
        catch (error) {
            if (error.message === msg.CIN_EXISTS) {
                newCustomer = await customerDb.findCustomerByCIN(customer.CIN);
            }
        }

        //=== step1:check lot availability
        await lotValidator.checkLotExists(sale.lotId);
        await lotValidator.checkLotAvailability(sale.lotId);

        //=== step1:calc financials and create sale
        sale.customerId = newCustomer.customerId;
        const size = await lotDb.getLotSize(sale.lotId);
        const pricePerM2 = await lotDb.getLotPricePerM2(sale.lotId);
        sale.totalPrice = parseFloat(pricePerM2) * parseFloat(size);
        sale.balanceDue = sale.totalPrice;
        sale.paidPercentage = "0";
        sale.status = msg.INITIATED;
        const newSale = await saleDb.createSale(sale);

        //=== step1:check and create payment
        payment.saleId = newSale.saleId
        await paymentValidator.validatePaymentSchema(payment);
        await paymentValidator.checkReceiptUnique(payment.receipt);

        if (paymentValidator.isReceiptProvided(payment.receipt)) {
            payment.status = msg.VERIFIED;
        }

        const newPayment = await paymentDb.createPayment(payment);
        await lotDb.updateLotStatus(sale.lotId, msg.RESERVED);
        sendSuccess(res, { newCustomer, sale, newPayment }, msg.SALE_CREATED_SUCCESS, 201);
    }),

    updateSale: asyncHandler(async (req, res) => {
        const saleId = req.params.id;
        const { lotId, customerId } = req.body;
        const saleDetails = req.body;

        const sale = await saleValidator.checkSaleExists(saleId);

        if (lotId && (lotId != sale.lotId)) {
            await saleValidator.checkLotExistsInSales(lotId, saleId)
            await lotValidator.checkLotExists(lotId);
            await lotValidator.checkLotAvailability(lotId);
        }

        if (customerId) {
            await customerValidator.checkCustomerExists(customerId);
        }

        saleDetails.updatedAt = new Date();
        const updatedSale = await saleDb.updateSale(saleId, saleDetails);
        sendSuccess(res, updatedSale, msg.SALE_UPDATED_SUCCESS);
    }),

    getSaleById: asyncHandler(async (req, res) => {
        const saleId = req.params.id;
        const sale = await saleValidator.checkSaleExists(saleId)
        sendSuccess(res, sale, msg.SALE_RETRIEVED_SUCCESS);
    }),

    deleteSaleById: asyncHandler(async (req, res) => {
        const saleId = req.params.id;
        await saleValidator.checkSaleExists(saleId);
        const sale = await saleDb.deleteSaleById(saleId);
        await lotDb.setOrphanedLotsAvailable();
        await saleDb.resetSequence();
        sendSuccess(res, sale, msg.SALE_DELETED_SUCCESS);
    }),

    initializeSales: asyncHandler(async (req, res) => {
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

        sendSuccess(res, { addedSales, skippedSales }, msg.SALES_INIT_SUCCESS);
    }),
};

export default SaleController;



