import ExpenseValidator from '../../Validators/subdivision/ExpenseValidator';
import { sendSuccess, sendError, withErrorHandler } from '../../services/responseHandler';
import expenseDb from '../../repositories/ExpenseDb';

import saleDb from '../../repositories/SaleDb';
import fileDb from '../../repositories/fileDb';
import { parseCSVFile } from '../../lib/utils';
import { promises as fsPromises } from 'fs';
import { msg } from '../../lib/constants/constants';
import path from 'path';
import fs from 'fs';

const expenseValidator = new ExpenseValidator();

const ExpenseController = {

    getAllExpenses: withErrorHandler(async (req, res) => {
        const allExpenses = await expenseDb.findAllExpenses();
        return sendSuccess(res, allExpenses, msg.PAYMENTS_RETRIEVED_SUCCESS);
    }),

    deleteAllExpenses: withErrorHandler(async (req, res) => {
        await expenseDb.deleteAllExpenses();
        await saleDb.resetAllSales()
        return sendSuccess(res, null, msg.PAYMENTS_DELETED_SUCCESS);
    }),
    //=================================================================//

    createExpense: withErrorHandler(async (req, res) => {
        const expenseDetails = req.body;
        const { receipt } = expenseDetails;
        await expenseValidator.validateExpenseSchema(expenseDetails);
        if (receipt) {
            await expenseValidator.checkReceiptUnique(receipt);
        }
        const newExpense = await expenseDb.createExpense(expenseDetails);
        return sendSuccess(res, newExpense, msg.PAYMENT_CREATED_SUCCESS, 201);
    }),

    updateExpense: withErrorHandler(async (req, res) => {
        const expenseId = req.params.id;
        const expenseDetails = req.body;
        const hasReceipt = !!expenseDetails.receipt;

        let oldExpense = await expenseValidator.checkExpenseExists(expenseId);

        if (hasReceipt) {
            await expenseValidator.checkReceiptUnique(expenseDetails.receipt);
            expenseDetails.status = msg.VERIFIED;
        }

        if (expenseDetails.receipt && expenseDetails.receipt !== oldExpense.receipt) {
            await fsPromises.rm(oldExpense.receipt);
            await fileDb.deleteFileByPath(oldExpense.receipt)
        }

        const updatedExpense = await expenseDb.updateExpense(expenseId, expenseDetails);
        return sendSuccess(res, updatedExpense, msg.PAYMENT_UPDATED_SUCCESS);
    }),

    getExpenseById: withErrorHandler(async (req, res) => {
        const expenseId = req.params.id;
        const expense = await expenseValidator.checkExpenseExists(expenseId)
        return sendSuccess(res, expense, msg.PAYMENT_RETRIEVED_SUCCESS);
    }),

    deleteExpenseById: withErrorHandler(async (req, res) => {
        const expenseId = req.params.id;
        await expenseValidator.checkExpenseExists(expenseId);
        const expense = await expenseDb.deleteExpenseById(expenseId);
        return sendSuccess(res, expense, msg.PAYMENT_DELETED_SUCCESS);
    }),

    //=================================================================//

    initializeExpenses: withErrorHandler(async (req, res) => {
        const expensesPath = path.join(__dirname, '../config', 'expenses.json');
        const expensesData = JSON.parse(fs.readFileSync(expensesPath, 'utf8'));

        let addedExpenses = [];
        let skippedExpenses = [];

        for (const expense of expensesData) {
            try {
                await expenseValidator.validateExpenseSchema(expense);

                const newExpense = await expenseDb.createExpense(expense);
                addedExpenses.push(newExpense);
            }
            catch (error) {
                if (error.message.includes(msg.PAYMENT_EXISTS)) {
                    skippedExpenses.push({ expense, reason: error.message });
                    continue;
                }
                throw error;
            }
        }

        return sendSuccess(res, { addedExpenses, skippedExpenses }, msg.PAYMENTS_INIT_SUCCESS);
    }),

    bulkAddExpensesFromCSV: withErrorHandler(async (req, res) => {

        const filePath = req.body.path;

        if (!filePath || !fs.existsSync(filePath)) {
            return sendError(res, 'Invalid or missing file path', 400);
        }

        const expensesData: any = await parseCSVFile(filePath);

        let addedExpenses = [];
        let skippedExpenses = [];

        for (const expense of expensesData) {
            try {
                await expenseValidator.validateExpenseSchema(expense);

                const newExpense = await expenseDb.createExpense(expense);
                addedExpenses.push(newExpense);
            }
            catch (error) {
                if (error.message.includes(msg.PAYMENT_EXISTS)) {
                    skippedExpenses.push({ expense, reason: error.message });
                    continue;
                }
                throw error;
            }
        }

        return sendSuccess(res, { addedExpenses, skippedExpenses }, msg.PAYMENTS_INIT_SUCCESS);
    }),
};

export default ExpenseController;



