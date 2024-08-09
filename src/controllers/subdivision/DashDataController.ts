import { sendSuccess, sendError, withErrorHandler } from '../../services/responseHandler';
import ExpenseDb from '../../repositories/ExpenseDb';
import paymentDb from '../../repositories/PaymentDb';

import saleDb from '../../repositories/SaleDb';
import {  payments,expenses } from '../../db/schema';
import { msg } from '../../lib/constants/constants';
import { eq, sql } from "drizzle-orm";
import { db } from '../../db/index';

const dashDataController = {

    getDashData: withErrorHandler(async (req, res) => {
        let salesLowestVerifiedPayments = await saleDb.findSalesWithLowestVerifiedPayments(7);
        let financialData = await dashDataController.getFinancialData();
        let verifiedPaymentsByYear = await dashDataController.getVerifiedPaymentsByYear();
        let expensesByYear = await dashDataController.getExpensesByYear();

        let responseData = {
            salesLowestVerifiedPayments,
            financialData,
            verifiedPaymentsByYear,
            expensesByYear
        };

        return sendSuccess(res, responseData, msg.PAYMENTS_RETRIEVED_SUCCESS);
    }),

    getFinancialData: async () => {

        const totalVerifiedPayments = await paymentDb.getTotalVerifiedPayments();
        const totalExpenses = await ExpenseDb.getTotalExpenses();
        const totalSalesCount = await saleDb.getSalesCount();

        return {
            totalVerifiedPayments: totalVerifiedPayments,
            totalExpenses: totalExpenses,
            netAmount: (totalVerifiedPayments - totalExpenses),
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
    },

    getExpensesByYear: async () => {
        const totalExpenses = sql`SUM(amount::numeric)`;
        const expenseYear = sql`DATE_PART('year', date)`;

        const result = await db.select({
            expenseYear,
            totalExpenses 
        })
            .from(expenses)
            .groupBy(expenseYear)
            .orderBy(expenseYear)
            .execute();

        result.forEach((row) => {
            row.totalExpenses = Number(row.totalExpenses);
        });

        return result;
    }
}

export default dashDataController


