import { payments,sales, } from '../../db/schema';
import { eq, sql,and } from "drizzle-orm";
import { msg } from '../../lib/constants'
import { db } from '../../db/index';

const paymentDb = {
    
    findAllPayments: async () => {
        return await db.select().from(payments); 
    },

    deleteAllPayments: async () => {
        return await db.delete(payments);
    },

    findPaymentById: async (paymentId) => {
        return await db.select().from(payments).where(eq(payments.paymentId, paymentId));
    },

    createPayment: async (paymentDetail) => {
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
        const [payment] = await db.delete(payments)
            .where(eq(payments.paymentId, paymentId))
            .returning();
        return payment;
    },

    getVerifiedPaymentsBySale: async (saleId) => {
        await db.select().from(payments).where(and(eq(sales.saleId, saleId), eq(payments.status, msg.VERIFIED)));
    },

    getTotalPaymentsBySale: async (saleId) => {
        const payments: any = await paymentDb.getVerifiedPaymentsBySale(saleId);
        return payments.reduce((total, payment) => total + payment.amount, 0);
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



