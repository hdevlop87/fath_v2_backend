import { eq, sql, and } from "drizzle-orm";
import { db } from '../db/index';
import { sales } from '../db/schema';
import Joi from 'joi';
import { msg } from '../lib/constants';

export default class SaleValidator {

    static instance = null;
    saleSchema: Joi.ObjectSchema<any>;
    userSaleSchema: Joi.ObjectSchema<any>;

    constructor() {
        if (SaleValidator.instance) {
            return SaleValidator.instance;
        }
        this.saleSchema = Joi.object({
            lotId: Joi.string().required(),
            customerId: Joi.string().required(),
            date: Joi.date().iso().required(),
        });

        SaleValidator.instance = this;
    }

    async validateSaleSchema(data) {
        try {
            await this.saleSchema.validateAsync(data);
        }
        catch (error) {
            if (error instanceof Joi.ValidationError) {
                throw new Error(error.details[0].message);
            } else {
                throw error;
            }
        }
    }

    async checkSaleExists(saleId) {
        const [sale] = await db.select().from(sales).where(eq(sales.saleId, saleId));
        if (!sale) {
            throw new Error(msg.SALE_NOT_FOUND);
        }
        return sale;
    }

    async checkLotExistsInSales(lotId, saleId = null) {
        if (!lotId) { 
            throw new Error(msg.LOT_NOT_FOUND);
        }
        const query = saleId
            ? sql`${sales.saleId} != ${saleId} AND ${sales.lotId} = ${lotId}`
            : sql`${sales.lotId} = ${lotId}`;

        const existingSale = await db.select().from(sales).where(query);
        if (existingSale.length > 0) {
            throw new Error(msg.SALE_EXISTS);
        }
    }

    static getInstance() {
        if (!SaleValidator.instance) {
            SaleValidator.instance = new SaleValidator();
        }
        return SaleValidator.instance;
    }
}



