import { expenses, } from '../db/schema';
import { eq, sql } from "drizzle-orm";
import { db } from '../db/index';
import fileDb from './fileDb';

const expenseDb = {

    findAllExpenses: async () => {
        return await db.select().from(expenses).orderBy(expenses.expenseId);
    },

    deleteAllExpenses: async () => {
        const allExpenses = await db.delete(expenses);
        await expenseDb.resetSequence()
        return allExpenses
    },

    findExpenseById: async (expenseId) => {
        const [expense] = await db.select().from(expenses).where(eq(expenses.expenseId, expenseId));
        return expense
    },

    createExpense: async (expenseDetail) => {
        await expenseDb.resetSequence();
        const [newExpense] = await db.insert(expenses).values(expenseDetail).returning();
        return newExpense;
    },

    updateExpense: async (expenseId, expenseDetails) => {
        const [updatedExpense] = await db.update(expenses)
            .set(expenseDetails)
            .where(eq(expenses.expenseId, expenseId))
            .returning();
        return updatedExpense;
    }, 

    deleteExpenseById: async (expenseId) => {
        const expense = await expenseDb.findExpenseById(expenseId);
        const receiptPath = expense.receipt;
        if (receiptPath) {
            await fileDb.deleteFileByPath(receiptPath);
        }
        const [deletedExpense] = await db.delete(expenses)
            .where(eq(expenses.expenseId, expenseId))
            .returning();
        await expenseDb.resetSequence()
        return deletedExpense;
    },

    getTotalExpenses: async () => {
        const expenses: any = await expenseDb.findAllExpenses();
        return expenses.reduce((total, expense) => total + parseFloat(expense.amount), 0);
    },

    resetSequence: async () => {
        try {
            const query = sql`SELECT setval(pg_get_serial_sequence('expenses', 'expenseId'), COALESCE((SELECT MAX("expenseId") + 1 FROM expenses), 1), false)`;
            await db.execute(query);
        } catch (error) {
            throw new Error('Error resetting sequence');
        }
    },


};

export default expenseDb;



