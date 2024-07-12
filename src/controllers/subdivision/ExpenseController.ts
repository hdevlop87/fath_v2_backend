import ExpenseValidator from '../../services/subdivision/ExpenseValidator';
import { sendSuccess, sendError } from '../../services/responseHandler';
import expenseDb from '../../repositories/ExpenseDb';
import asyncHandler from '../../lib/asyncHandler'
import saleDb from '../../repositories/SaleDb';
import fileDb from '../../repositories/fileDb';
import {parseCSVFile} from '../../lib/utils';
import { promises as fsPromises } from 'fs';
import { msg } from '../../lib/constants';
import path from 'path';
import fs from 'fs';

const expenseValidator = new ExpenseValidator();

const ExpenseController = {

    getAllExpenses: asyncHandler(async (req, res) => {
        const allExpenses = await expenseDb.findAllExpenses();
        sendSuccess(res, allExpenses, msg.PAYMENTS_RETRIEVED_SUCCESS);
    }),

    deleteAllExpenses: asyncHandler(async (req, res) => {
        await expenseDb.deleteAllExpenses();
        await expenseDb.resetSequence();
        await saleDb.resetAllSales()
        sendSuccess(res, null, msg.PAYMENTS_DELETED_SUCCESS);
    }),
    //=================================================================//

    createExpense: asyncHandler(async (req, res) => {
        const expenseDetails = req.body;
        const { receipt } = expenseDetails;
        await expenseValidator.validateExpenseSchema(expenseDetails);
        await expenseValidator.checkReceiptUnique(receipt);
        const newExpense = await expenseDb.createExpense(expenseDetails);
        sendSuccess(res, newExpense, msg.PAYMENT_CREATED_SUCCESS, 201);
    }),

    updateExpense: asyncHandler(async (req, res) => {
        const expenseId = req.params.id;
        const expenseDetails = req.body;
        const hasReceipt = !!expenseDetails.receipt;
        let oldExpense = await expenseValidator.checkExpenseExists(expenseId)

        const validations = {
            expenseId: expenseValidator.checkExpenseExists,
            receipt: expenseValidator.checkReceiptUnique,
        };

        for (const [field, validationFn] of Object.entries(validations)) {
            if (expenseDetails.hasOwnProperty(field)) {
                await validationFn(expenseDetails[field], expenseId);
            }
        }

        if (expenseDetails.receipt && expenseDetails.receipt !== oldExpense.receipt) {
            try {
                await fsPromises.rm(oldExpense.receipt); 
                await fileDb.deleteFileByPath(oldExpense.receipt)
            } catch (err) {
                console.error('Failed to remove old receipt file:', err);
            }
        }

        if (hasReceipt) {
            expenseDetails.status = msg.VERIFIED;
        }

        const updatedExpense = await expenseDb.updateExpense(expenseId, expenseDetails);
        sendSuccess(res, updatedExpense, msg.PAYMENT_UPDATED_SUCCESS);
    }),

    getExpenseById: asyncHandler(async (req, res) => {
        const expenseId = req.params.id;
        const expense = await expenseValidator.checkExpenseExists(expenseId)
        sendSuccess(res, expense, msg.PAYMENT_RETRIEVED_SUCCESS);
    }),

    deleteExpenseById: asyncHandler(async (req, res) => {
        const expenseId = req.params.id;
        await expenseValidator.checkExpenseExists(expenseId);
        const expense = await expenseDb.deleteExpenseById(expenseId);
        await expenseDb.resetSequence();
        sendSuccess(res, expense, msg.PAYMENT_DELETED_SUCCESS);
    }),

    //=================================================================//

    initializeExpenses: asyncHandler(async (req, res) => {
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

        sendSuccess(res, { addedExpenses, skippedExpenses }, msg.PAYMENTS_INIT_SUCCESS);
    }),

    bulkAddExpensesFromCSV: asyncHandler(async (req, res) => {
    
        const filePath = req.body.path;

        if (!filePath || !fs.existsSync(filePath)) {
            return sendError(res, 'Invalid or missing file path', 400);
        }

        const expensesData:any = await parseCSVFile(filePath);

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

        sendSuccess(res, { addedExpenses, skippedExpenses }, msg.PAYMENTS_INIT_SUCCESS);
    }),
};

export default ExpenseController;



