import { eq, sql, and } from "drizzle-orm";
import { db } from '../../db/index';
import { payments } from '../../db/schema';
import Joi from 'joi';
import { msg } from '../../lib/constants';

export default class PaymentValidator {

    static instance = null;
    paymentSchema: Joi.ObjectSchema<any>;
    userPaymentSchema: Joi.ObjectSchema<any>;

    constructor() {
        if (PaymentValidator.instance) {
            return PaymentValidator.instance;
        }
        this.paymentSchema = Joi.object({
            paymentId: Joi.string().optional(),
            saleId: Joi.any().required(),
            amount: Joi.number().required(),
            date: Joi.date(),
            method: Joi.string().valid(msg.CHEQUE, msg.ESPECE, msg.CREDIT_CARD, msg.BANK_TRANSFER).required(),
            paymentReference: Joi.string().allow('').optional(),
            status: Joi.string().valid(msg.PENDING, msg.VERIFIED, msg.FAILED).default(msg.PENDING),
            receipt: Joi.string().allow('').optional(),
            notes: Joi.string().allow('').optional()
        });

        PaymentValidator.instance = this;
    }

    isReceiptProvided(receipt) {
        return receipt !== undefined && receipt.length >= 1;
    }

    async checkReceiptUnique(receipt, paymentId = null) {
        if (!receipt) {
            return; 
        }
        const query = paymentId
            ? sql`${payments.paymentId} != ${paymentId} AND ${payments.receipt} = ${receipt}`
            : sql`${payments.receipt} = ${receipt}`;

        const existingPayment = await db.select().from(payments).where(query);
        if (existingPayment.length > 0) {
            throw new Error(msg.PAYMENT_EXISTS);
        }
    }

    async validatePaymentSchema(data) {
        try {
            await this.paymentSchema.validateAsync(data);
        }
        catch (error) {
            if (error instanceof Joi.ValidationError) {
                throw new Error(error.details[0].message);
            } else {
                throw error;
            }
        }
    }

    async checkPaymentExists(paymentId) {
        const [payment] = await db.select().from(payments).where(eq(payments.paymentId, paymentId));
        if (!payment) {
            throw new Error(msg.PAYMENT_NOT_FOUND);
        }
        return payment;
    }

    static getInstance() {
        if (!PaymentValidator.instance) {
            PaymentValidator.instance = new PaymentValidator();
        }
        return PaymentValidator.instance;
    }
}

