import { sales, payments } from '../../db/schema';
import { eq, sql, and } from "drizzle-orm";
import lotDb from '../LotController/LotDb';
import { msg } from '../../lib/constants'
import { db } from '../../db/index';

const saleDb = {

    findAllSales: async () => {
        return await db.select().from(sales);
    },

    deleteAllSales: async () => {
        return await db.delete(sales);
    },

    resetAllSales: async () => {
        const resetData: any = { balanceDue: 0, paidPercentage: 0, status: msg.INITIATED };
        await lotDb.resetAllLots()
        return await db.update(sales).set(resetData).returning();
    },

    resetSale: async (saleId) => {
        const resetData = { balanceDue: 0, paidPercentage: 0, status: msg.INITIATED };
        const updatedSale = await saleDb.updateSale(saleId, { ...resetData });
        return updatedSale;
    },

    findSaleById: async (saleId) => {
        return await db.select().from(sales).where(eq(sales.saleId, saleId));
    },

    createSale: async (saleDetail) => {
        const [newSale] = await db.insert(sales).values(saleDetail).returning();
        await lotDb.updateLotStatusBasedSale(newSale);
        return newSale;
    },

    updateSale: async (saleId, saleDetails) => {
        const [updatedSale] = await db.update(sales)
            .set(saleDetails)
            .where(eq(sales.saleId, saleId))
            .returning();

        await lotDb.updateLotStatusBasedSale(updatedSale);
        return updatedSale;
    },

    deleteSaleById: async (saleId) => {
        const [sale] = await db.delete(sales)
            .where(eq(sales.saleId, saleId))
            .returning();

        await lotDb.updateLotStatusBasedSale(sale);
        return sale;
    },

    getVerifiedPayments: async (saleId) => {
        return await db.select().from(payments).where(and(eq(payments.saleId, saleId), eq(payments.status, 'Verified')));
    },

    getTotalPayments: async (saleId) => {
        const payments: any = await saleDb.getVerifiedPayments(saleId);
        return payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    },

    getTotalPrice: async (saleId) => {
        const [{ totalPrice }] = await db.select({ totalPrice: sales.totalPrice }).from(sales).where(eq(sales.saleId, saleId));
        return parseInt(totalPrice)
    },

    calcSaleFinancials: async (saleId) => {
        const totalPayments = await saleDb.getTotalPayments(saleId) || 0;
        const totalPrice = await saleDb.getTotalPrice(saleId);

        const newBalanceDue = Math.max(totalPrice - totalPayments, 0);
        const newPaidPercentage = Math.min(totalPayments / totalPrice * 100, 100);

        return {
            balanceDue: newBalanceDue,
            paidPercentage: newPaidPercentage,
        }
    },

    checkSaleStatus: async (saleId) => {

        const totalPayments = await saleDb.getTotalPayments(saleId);
        const totalPrice = await saleDb.getTotalPrice(saleId);

        switch (true) {
            case totalPayments === 0:
                return msg.INITIATED;
            case totalPayments < totalPrice:
                return msg.ONGOING;
            case totalPayments >= totalPrice:
                return msg.COMPLETED;
        }
    },

    updateSaleOnPayment: async (saleId) => {
        const financials = await saleDb.calcSaleFinancials(saleId);
        const status = await saleDb.checkSaleStatus(saleId);
        const updatedSale = await saleDb.updateSale(saleId, { ...financials, status });
        return updatedSale
    },

    resetSequence: async () => {
        try {
            const query = sql`SELECT setval(pg_get_serial_sequence('sales', 'saleId'), COALESCE((SELECT MAX("saleId") + 1 FROM sales), 1), false)`;
            await db.execute(query);
        } catch (error) {
            throw new Error('Error resetting sequence');
        }
    },
};

export default saleDb;





