import { sendSuccess } from '../../services/responseHandler';
import ExpenseDb from '../../repositories/ExpenseDb';
import paymentDb from '../../repositories/PaymentDb';
import asyncHandler from '../../lib/asyncHandler';
import saleDb from '../../repositories/SaleDb';
import {  payments } from '../../db/schema';
import { msg } from '../../lib/constants';
import { eq, sql } from "drizzle-orm";
import { db } from '../../db/index';

const dashDataController = {

    getDashData: asyncHandler(async (req, res) => {
        let salesLowestVerifiedPayments = await saleDb.findSalesWithLowestVerifiedPayments(6);
        let financialData = await dashDataController.getFinancialData();
        let verifiedPaymentsByYear = await dashDataController.getVerifiedPaymentsByYear();

        let responseData = {
            salesLowestVerifiedPayments,
            financialData,
            verifiedPaymentsByYear
        };

        sendSuccess(res, responseData, msg.PAYMENTS_RETRIEVED_SUCCESS);
    }),

    getFinancialData: async () => {

        const totalVerifiedPayments = await paymentDb.getTotalVerifiedPayments();
        const totalExpenses = await ExpenseDb.getTotalExpenses();
        const totalSalesCount = await saleDb.getSalesCount();

        return {
            totalVerifiedPayments,
            totalExpenses,
            netAmount: totalVerifiedPayments - totalExpenses,
            totalSalesCount
        };
    },

    getVerifiedPaymentsByYear: async () => {
        const totalPayments = sql`SUM(amount::numeric)`;
        const paymentYear = sql`DATE_PART('year', date)`;

        const result = await db.select({
            paymentYear,
            totalPayments
        })
            .from(payments)
            .where(eq(payments.status, msg.VERIFIED))
            .groupBy(paymentYear)
            .orderBy(paymentYear)
            .execute();

        result.forEach((row) => {
            row.totalPayments = Number(row.totalPayments);
        });

        return result;
    }
}

export default dashDataController


