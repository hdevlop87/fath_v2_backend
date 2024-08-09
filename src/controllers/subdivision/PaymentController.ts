import PaymentValidator from '../../Validators/subdivision/PaymentValidator';
import { sendSuccess, sendError, withErrorHandler } from '../../services/responseHandler';
import SaleValidator from '../../Validators/subdivision/SaleValidator';
import paymentDb from '../../repositories/PaymentDb';

import saleDb from '../../repositories/SaleDb';
import fileDb from '../../repositories/fileDb';
import { parseCSVFile } from '../../lib/utils';
import { promises as fsPromises } from 'fs';
import { msg } from '../../lib/constants/constants';
import path from 'path';
import fs from 'fs';

const paymentValidator = new PaymentValidator();
const saleValidator = new SaleValidator();


const PaymentController = {
    //===================== many payments actions ======================//
    getAllPayments: withErrorHandler(async (req, res) => {
        const allPayments = await paymentDb.findAllPayments();
        return sendSuccess(res, allPayments, msg.PAYMENTS_RETRIEVED_SUCCESS);
    }),

    deleteAllPayments: withErrorHandler(async (req, res) => {
        await paymentDb.deleteAllPayments();
        await paymentDb.resetSequence();
        await saleDb.resetAllSales()
        return sendSuccess(res, null, msg.PAYMENTS_DELETED_SUCCESS);
    }),
    //===============================================================//

    createPayment: withErrorHandler(async (req, res) => {
        let paymentDetails = req.body;
        let { saleId, lotRef, receipt } = paymentDetails;

        if (!saleId && lotRef) {
            const sale = await saleDb.findSaleByLotRef(lotRef);
            if (sale) {
                saleId = sale.saleId;
                paymentDetails.saleId = saleId;
                delete paymentDetails.lotRef
            } else {
                return res.status(400).json({ message: msg.SALE_NOT_FOUND });
            }
        }

        const hasReceipt = !!paymentDetails.receipt;
        await paymentValidator.validatePaymentSchema(paymentDetails);
        await saleValidator.checkSaleExists(saleId);
        await paymentValidator.checkReceiptUnique(receipt);

        if (paymentValidator.isReceiptProvided(paymentDetails.receipt)) {
            paymentDetails.status = msg.VERIFIED;
        }

        if (hasReceipt) {
            paymentDetails.status = msg.VERIFIED;
        }

        const newPayment = await paymentDb.createPayment(paymentDetails);
        await saleDb.updateSaleOnPayment(saleId);
        return sendSuccess(res, newPayment, msg.PAYMENT_CREATED_SUCCESS, 201);
    }),

    updatePayment: withErrorHandler(async (req, res) => {
        const paymentId = req.params.id;
        const paymentDetails = req.body;
        const hasReceipt = !!paymentDetails.receipt;
        let oldPayment = await paymentValidator.checkPaymentExists(paymentId);

        const validations = {
            paymentId: paymentValidator.checkPaymentExists,
            receipt: paymentValidator.checkReceiptUnique,
        };

        for (const [field, validationFn] of Object.entries(validations)) {
            if (paymentDetails.hasOwnProperty(field)) {
                await validationFn(paymentDetails[field], paymentId);
            }
        }

        if (oldPayment.receipt && paymentDetails.receipt && paymentDetails.receipt !== oldPayment.receipt) {
            try {
                await fsPromises.rm(oldPayment.receipt);
                await fileDb.deleteFileByPath(oldPayment.receipt);
            } catch (err) {
                console.error('Failed to remove old receipt file:', err);
            }
        }

        if (hasReceipt) {
            paymentDetails.status = msg.VERIFIED;
        }

        if (paymentDetails.saleId === null) {
            delete paymentDetails.saleId;
        }

        const updatedPayment = await paymentDb.updatePayment(paymentId, paymentDetails);
        
        await saleDb.updateSaleOnPayment(updatedPayment.saleId);
        return sendSuccess(res, updatedPayment, msg.PAYMENT_UPDATED_SUCCESS);
    }),

    getPaymentById: withErrorHandler(async (req, res) => {
        const paymentId = req.params.id;
        const payment = await paymentValidator.checkPaymentExists(paymentId)
        return sendSuccess(res, payment, msg.PAYMENT_RETRIEVED_SUCCESS);
    }),

    getPaymentsBySaleId: withErrorHandler(async (req, res) => {
        const saleId = req.params.saleId;
        const payments = await paymentDb.getPaymentsBySaleId(saleId);
        return sendSuccess(res, payments, msg.PAYMENTS_RETRIEVED_SUCCESS);
    }),

    deletePaymentById: withErrorHandler(async (req, res) => {
        const paymentId = req.params.id;
        await paymentValidator.checkPaymentExists(paymentId);
        const payment = await paymentDb.deletePaymentById(paymentId);
        await paymentDb.resetSequence();
        await saleDb.updateSaleOnPayment(payment.saleId);
        return sendSuccess(res, payment, msg.PAYMENT_DELETED_SUCCESS);
    }),

    initializePayments: withErrorHandler(async (req, res) => {
        const paymentsPath = path.join(__dirname, '../config', 'payments.json');
        const paymentsData = JSON.parse(fs.readFileSync(paymentsPath, 'utf8'));

        let addedPayments = [];
        let skippedPayments = [];

        for (const payment of paymentsData) {
            try {
                await paymentValidator.validatePaymentSchema(payment);

                const newPayment = await paymentDb.createPayment(payment);
                addedPayments.push(newPayment);
            }
            catch (error) {
                if (error.message.includes(msg.PAYMENT_EXISTS)) {
                    skippedPayments.push({ payment, reason: error.message });
                    continue;
                }
                throw error;
            }
        }

        return sendSuccess(res, { addedPayments, skippedPayments }, msg.PAYMENTS_INIT_SUCCESS);
    }),

    bulkAddPaymentsFromCSV: withErrorHandler(async (req, res) => {

        const filePath = req.body.path;

        if (!filePath || !fs.existsSync(filePath)) {
            return sendError(res, 'Invalid or missing file path', 400);
        }

        const paymentsData: any = await parseCSVFile(filePath);

        let addedPayments = [];
        let skippedPayments = [];

        for (const payment of paymentsData) {
            try {
                await paymentValidator.validatePaymentSchema(payment);

                const newPayment = await paymentDb.createPayment(payment);
                addedPayments.push(newPayment);
            }
            catch (error) {
                if (error.message.includes(msg.PAYMENT_EXISTS)) {
                    skippedPayments.push({ payment, reason: error.message });
                    continue;
                }
                throw error;
            }
        }

        return sendSuccess(res, { addedPayments, skippedPayments }, msg.PAYMENTS_INIT_SUCCESS);
    }),
};

export default PaymentController;



