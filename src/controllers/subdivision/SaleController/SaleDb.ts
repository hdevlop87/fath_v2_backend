import { sales, payments, lots, customers } from '../../../db/schema';
import { eq, sql, and } from "drizzle-orm";
import lotDb from './../LotController/LotDb';
import { msg } from '../../../lib/constants'
import { db } from '../../../db/index';
import paymentDb from '../PaymentController/PaymentDb'

const saleDb = {

    findAllSales: async () => {
        return await db.select({
            saleId: sales.saleId,
            customerId: sales.customerId,
            lotId: sales.lotId,
            totalPrice: sales.totalPrice,
            totalVerifiedPayments: sales.totalVerifiedPayments,
            balanceDue: sales.balanceDue,
            paidPercentage: sales.paidPercentage,
            date: sales.date,
            status: sales.status,
            createdAt: sales.createdAt,
            updatedAt: sales.updatedAt,
            lotRef: lots.lotRef,
            size: lots.size,
            pricePerM2: lots.pricePerM2,
            customerName: customers.name,
        })
            .from(sales)
            .leftJoin(lots, eq(sales.lotId, lots.lotId))
            .leftJoin(customers, eq(sales.customerId, customers.customerId))
            .orderBy(lots.lotRef);
    },

    findAllPaymentsBySaleId: async (saleId) => {
        return await db.select().from(payments).where(eq(payments.saleId, saleId)).orderBy(payments.date);;
    },

    findSalesWithLowestVerifiedPayments: async (limit = 6) => {
        return await db.select({
            saleId: sales.saleId,
            customerId: sales.customerId,
            lotId: sales.lotId,
            totalPrice: sales.totalPrice,
            totalVerifiedPayments: sales.totalVerifiedPayments,
            balanceDue: sales.balanceDue,
            paidPercentage: sales.paidPercentage,
            date: sales.date,
            status: sales.status,
            createdAt: sales.createdAt,
            updatedAt: sales.updatedAt,
            lotRef: lots.lotRef,
            size: lots.size,
            pricePerM2: lots.pricePerM2,
            customerName: customers.name,
        })
            .from(sales)
            .leftJoin(lots, eq(sales.lotId, lots.lotId))
            .leftJoin(customers, eq(sales.customerId, customers.customerId))
            .where(sql`${sales.totalVerifiedPayments} > 0`)
            .orderBy(sales.totalVerifiedPayments)
            .limit(limit);
    },

    findSaleByLotRef: async (lotRef) => {
        let [sale] = await db.select({
            saleId: sales.saleId,
            customerId: sales.customerId,
            lotId: sales.lotId,
            totalPrice: sales.totalPrice,
            totalVerifiedPayments: sales.totalVerifiedPayments,
            balanceDue: sales.balanceDue,
            paidPercentage: sales.paidPercentage,
            date: sales.date,
            status: sales.status,
            createdAt: sales.createdAt,
            updatedAt: sales.updatedAt,
            lotRef: lots.lotRef,
            size: lots.size,
            pricePerM2: lots.pricePerM2,
            customerName: customers.name,
        })
            .from(sales)
            .leftJoin(lots, eq(sales.lotId, lots.lotId))
            .leftJoin(customers, eq(sales.customerId, customers.customerId))
            .where(eq(lots.lotRef, lotRef))
            .orderBy(lots.lotRef);

        return sale
    },

    findSaleById: async (saleId) => {
        let [sale] = await db.select({
            saleId: sales.saleId,
            customerId: sales.customerId,
            lotId: sales.lotId,
            totalPrice: sales.totalPrice,
            totalVerifiedPayments: sales.totalVerifiedPayments,
            balanceDue: sales.balanceDue,
            paidPercentage: sales.paidPercentage,
            date: sales.date,
            status: sales.status,
            createdAt: sales.createdAt,
            updatedAt: sales.updatedAt,
            lotRef: lots.lotRef,
            size: lots.size,
            pricePerM2: lots.pricePerM2,
            customerName: customers.name,
        })
            .from(sales)
            .leftJoin(lots, eq(sales.lotId, lots.lotId))
            .leftJoin(customers, eq(sales.customerId, customers.customerId))
            .where(eq(sales.saleId, saleId));

        return sale;
    },

    deleteAllSales: async () => {
        const allSales = await db.delete(sales);
        await saleDb.resetSequence()
        return allSales
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



    createSale: async (saleDetail) => {
        await saleDb.resetSequence();
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

        const payments = await saleDb.findAllPaymentsBySaleId(saleId);

        for (const payment of payments) {
            await paymentDb.deletePaymentById(payment.paymentId);
        }

        const [sale] = await db.delete(sales)
            .where(eq(sales.saleId, saleId))
            .returning();

        await lotDb.updateLotStatusBasedSale(sale);
        await saleDb.resetSequence()
        return sale;
    },

    getTotalPrice: async (saleId) => {
        const [{ totalPrice }] = await db.select({ totalPrice: sales.totalPrice }).from(sales).where(eq(sales.saleId, saleId));
        return parseFloat(totalPrice)
    },

    getSalesCount:async()=>{
        const [{ totalSalesCount }] = await db.select({totalSalesCount: sql`COUNT(*)`}).from(sales);
        return Number(totalSalesCount)
    },

    setTotalPrice: async (saleId, newTotalPrice) => {
        await saleDb.updateSale(saleId, { totalPrice: newTotalPrice });
        const financials = await saleDb.calcSaleFinancials(saleId);
        const status = await saleDb.checkSaleStatus(saleId);
        const updatedSale = await saleDb.updateSale(saleId, { ...financials, status });
        return updatedSale;
    },

    calcSaleFinancials: async (saleId) => {
        const totalPrice = await saleDb.getTotalPrice(saleId);
        const totalVerifiedPayments = await paymentDb.getTotalVerifiedPaymentsBySale(saleId);
        const balanceDue = Math.max(totalPrice - totalVerifiedPayments, 0);
        const paidPercentage = Math.min(totalVerifiedPayments / totalPrice * 100, 100);

        return {
            balanceDue,
            paidPercentage,
            totalVerifiedPayments
        }
    },

    checkSaleStatus: async (saleId) => {
        const totalPayments = await paymentDb.getTotalVerifiedPaymentsBySale(saleId);
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





