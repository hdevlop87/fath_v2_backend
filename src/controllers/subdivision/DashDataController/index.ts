import { sendSuccess, sendError } from '../../../services/responseHandler';
import { sales, payments, lots, customers } from '../../../db/schema';
import { eq, sql, and } from "drizzle-orm";
import { db } from '../../../db/index';
import paymentDb from '../PaymentController/PaymentDb';
import asyncHandler from '../../../lib/asyncHandler';
import { msg } from '../../../lib/constants';
import saleDb from '../SaleController/SaleDb';
import ExpenseDb from '../ExpenseController/ExpenseDb';

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


