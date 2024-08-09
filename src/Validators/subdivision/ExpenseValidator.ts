import { eq, sql, and } from "drizzle-orm";
import { db } from '../../db/index';
import { expenses } from '../../db/schema';
import Joi from 'joi';
import { msg } from '../../lib/constants/constants';

export default class ExpenseValidator {

    static instance = null;
    expenseSchema: Joi.ObjectSchema<any>;
    userExpenseSchema: Joi.ObjectSchema<any>;

    constructor() {
        if (ExpenseValidator.instance) {
            return ExpenseValidator.instance;
        }
        this.expenseSchema = Joi.object({
            expenseId: Joi.string().optional(),
            amount: Joi.any().required(),
            beneficiary: Joi.string().required(),
            date: Joi.date(),
            type: Joi.string().optional(),
            method: Joi.string().required(),
            reference: Joi.string().allow('').optional(),
            receipt: Joi.string().allow('').optional(),
            notes: Joi.string().allow('').optional()
        });

        ExpenseValidator.instance = this;
    }

    async validateExpenseSchema(data) {
        try {
            await this.expenseSchema.validateAsync(data);
        }
        catch (error) {
            if (error instanceof Joi.ValidationError) {
                throw new Error(error.details[0].message);
            } else {
                throw error;
            }
        }
    } 

    isReceiptProvided(receipt) {
        return receipt !== undefined && receipt.length >= 1;
    }

    async checkReceiptUnique(receipt, expenseId = null) {
        const query = expenseId
            ? sql`${expenses.expenseId} != ${expenseId} AND ${expenses.receipt} = ${receipt}`
            : sql`${expenses.receipt} = ${receipt}`;

        const [existingExpense] = await db.select().from(expenses).where(query);
        if (existingExpense) {
            throw new Error(msg.PAYMENT_EXISTS);
        }

        return existingExpense
    }


    async checkExpenseExists(expenseId) {
        const [expense] = await db.select().from(expenses).where(eq(expenses.expenseId, expenseId));
        if (!expense) {
            throw new Error(msg.PAYMENT_NOT_FOUND);
        }
        return expense;
    }

    static getInstance() {
        if (!ExpenseValidator.instance) {
            ExpenseValidator.instance = new ExpenseValidator();
        }
        return ExpenseValidator.instance;
    }
}

