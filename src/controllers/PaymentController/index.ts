import PaymentValidator from '../../services/PaymentValidator';
import { sendSuccess } from '../../services/responseHandler';
import SaleValidator from '../../services/SaleValidator';
import asyncHandler from '../../lib/asyncHandler'
import saleDb from '../SaleController/SaleDb';
import { msg } from '../../lib/constants';
import paymentDb from './PaymentDb';
import path from 'path';
import fs from 'fs';

const paymentValidator = new PaymentValidator();
const saleValidator = new SaleValidator();


const PaymentController = {
    //===================== many payments actions ======================//
    getAllPayments: asyncHandler(async (req, res) => {
        const allPayments = await paymentDb.findAllPayments();
        sendSuccess(res, allPayments, msg.PAYMENTS_RETRIEVED_SUCCESS);
    }),

    deleteAllPayments: asyncHandler(async (req, res) => {
        await paymentDb.deleteAllPayments();
        await paymentDb.resetSequence();
        await saleDb.resetAllSales()
        sendSuccess(res, null, msg.PAYMENTS_DELETED_SUCCESS);
    }),
    //===============================================================//

    createPayment: asyncHandler(async (req, res) => {
        const paymentDetails = req.body;
        const { saleId, receipt } = paymentDetails;

        await paymentValidator.validatePaymentSchema(paymentDetails);
        await saleValidator.checkSaleExists(saleId);
        await paymentValidator.checkReceiptUnique(receipt);

        if (paymentValidator.isReceiptProvided(paymentDetails.receipt)) {
            paymentDetails.status = msg.VERIFIED;
        }

        const newPayment = await paymentDb.createPayment(paymentDetails);
        await saleDb.updateSaleOnPayment(saleId);
        sendSuccess(res, newPayment, msg.PAYMENT_CREATED_SUCCESS, 201);
    }),

    updatePayment: asyncHandler(async (req, res) => {
        const paymentId = req.params.id;
        const paymentDetails = req.body;

        const validations = {
            paymentId: paymentValidator.checkPaymentExists,
            receipt: paymentValidator.checkReceiptUnique,
        };

        for (const [field, validationFn] of Object.entries(validations)) {
            if (paymentDetails.hasOwnProperty(field)) {
                await validationFn(paymentDetails[field], paymentId);
            }
        }

        if (paymentValidator.isReceiptProvided(paymentDetails.receipt)) {
            paymentDetails.status = msg.VERIFIED;
        }
        else if (paymentDetails.receipt === '') {
            paymentDetails.status = msg.PENDING;
        }

        const updatedPayment = await paymentDb.updatePayment(paymentId, paymentDetails);
        await saleDb.updateSaleOnPayment(updatedPayment.saleId);
        sendSuccess(res, updatedPayment, msg.PAYMENT_UPDATED_SUCCESS);
    }),

    getPaymentById: asyncHandler(async (req, res) => {
        const paymentId = req.params.id;
        const payment = await paymentValidator.checkPaymentExists(paymentId)
        sendSuccess(res, payment, msg.PAYMENT_RETRIEVED_SUCCESS);
    }),

    deletePaymentById: asyncHandler(async (req, res) => {
        const paymentId = req.params.id;
        await paymentValidator.checkPaymentExists(paymentId);
        const payment = await paymentDb.deletePaymentById(paymentId);
        await paymentDb.resetSequence();
        await saleDb.updateSaleOnPayment(payment.saleId);
        sendSuccess(res, payment, msg.PAYMENT_DELETED_SUCCESS);
    }),

    initializePayments: asyncHandler(async (req, res) => {
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

        sendSuccess(res, { addedPayments, skippedPayments }, msg.PAYMENTS_INIT_SUCCESS);
    }),
};

export default PaymentController;



