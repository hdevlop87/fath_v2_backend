import { payments, sales } from '../db/schema';
import { eq, sql, and } from "drizzle-orm";
import { msg } from '../lib/constants/constants'
import { db } from '../db/index';
import fileDb from './fileDb';

const paymentDb = {

    findAllPayments: async () => {
        return await db.select().from(payments).orderBy(payments.paymentId);
    },

    deleteAllPayments: async () => {
        const allPayments = await db.delete(payments);
        await paymentDb.resetSequence()
        return allPayments
    },

    findPaymentById: async (paymentId) => {
        const [payment] = await db.select().from(payments).where(eq(payments.paymentId, paymentId));
        return payment
    },

    createPayment: async (paymentDetail) => {
        await paymentDb.resetSequence();
        const [newPayment] = await db.insert(payments).values(paymentDetail).returning();
        return newPayment;
    },

    updatePayment: async (paymentId, paymentDetails) => {
        const [updatedPayment] = await db.update(payments)
            .set(paymentDetails)
            .where(eq(payments.paymentId, paymentId))
            .returning();
        return updatedPayment;
    },

    deletePaymentById: async (paymentId) => {
        const payment = await paymentDb.findPaymentById(paymentId);
        const receiptPath = payment.receipt;
        if (receiptPath) {
            await fileDb.deleteFileByPath(receiptPath);
        }
        const [deletedPayment] = await db.delete(payments)
            .where(eq(payments.paymentId, paymentId))
            .returning();
        await paymentDb.resetSequence();
        return deletedPayment;
    },

    getVerifiedPayments: async () => {
        return await db.select().from(payments).where(eq(payments.status, msg.VERIFIED));
    },

    getVerifiedPaymentsBySaleId: async (saleId) => {
        return await db.select().from(payments).where(and(eq(payments.saleId, saleId), eq(payments.status, msg.VERIFIED)));
    },

    getTotalVerifiedPayments: async () => {
        const payments: any = await paymentDb.getVerifiedPayments();
        return payments.reduce((total, payment) => total + parseFloat(payment.amount), 0);
    },

    getTotalVerifiedPaymentsBySale: async (saleId) => {
        const payments: any = await paymentDb.getVerifiedPaymentsBySaleId(saleId);
        return payments.reduce((total, payment) => total + parseFloat(payment.amount), 0);
    },

    getPaymentsBySaleId: async (saleId) => {
        return await db.select().from(payments).where(eq(payments.saleId, saleId));
    },

    setPaymentVerified: async (paymentId) => {
        const [updatedPayment] = await db.update(payments)
            .set({ status: msg.VERIFIED })
            .where(eq(payments.paymentId, paymentId))
            .returning();
        return updatedPayment;
    },

    resetSequence: async () => {
        try {
            const query = sql`SELECT setval(pg_get_serial_sequence('payments', 'paymentId'), COALESCE((SELECT MAX("paymentId") + 1 FROM payments), 1), false)`;
            await db.execute(query);
        } catch (error) {
            throw new Error('Error resetting sequence');
        }
    },


};

export default paymentDb;



