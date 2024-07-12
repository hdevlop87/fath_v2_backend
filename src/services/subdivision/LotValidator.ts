import { eq, sql, and } from "drizzle-orm";
import { db } from '../../db/index';
import { lots } from '../../db/schema';
import Joi from 'joi';
import { msg } from '../../lib/constants';

export default class LotValidator {

    static instance = null;
    lotSchema: Joi.ObjectSchema<any>;
    userLotSchema: Joi.ObjectSchema<any>;

    constructor() {
        if (LotValidator.instance) {
            return LotValidator.instance;
        }
        this.lotSchema = Joi.object({
            lotId: Joi.number().integer().positive(),
            lotRef: Joi.string().max(15).required(),
            status: Joi.string().valid(  
                msg.AVAILABLE,
                msg.RESERVED,
                msg.ONGOING,
                msg.SOLD,
                msg.CANCELED).optional(),
            size: Joi.string().required(),
            pricePerM2: Joi.string().optional(),
            zoningCode: Joi.string().max(50).required(),
            description: Joi.string().allow('').optional(),
        });

        LotValidator.instance = this;
    }

    async validateLotSchema(data) {
        try {
            await this.lotSchema.validateAsync(data);
        }
        catch (error) {
            if (error instanceof Joi.ValidationError) {
                throw new Error(error.details[0].message);
            } else {
                throw error;
            }
        }
    }

    async checkLotExists(lotId) {
        const [lot] = await db.select().from(lots).where(eq(lots.lotId, lotId));
        if (!lot) {
            throw new Error(msg.LOT_NOT_FOUND);
        }
        return lot;
    }

    async checkLotRefExists(lotRef, lotId = null) {
        const query = lotId
            ? sql`${lots.lotId} != ${lotId} AND ${lots.lotRef} = ${lotRef}`
            : sql`${lots.lotRef} = ${lotRef}`;

        const [existingLot] = await db.select().from(lots).where(query);
        if (existingLot) {
            throw new Error(msg.LOT_EXISTS);
        }
        
        existingLot
    } 

    async checkLotAvailability(lotId) {
        const [{ status }] = await db.select({ status: lots.status }).from(lots).where(eq(lots.lotId, lotId));
        if (status !== 'Available') {
            throw new Error(msg.LOT_NOT_AVAILABLE);
        }
        return status
    };

    async checkLotAvailabilityByRef(lotRef) {
        const [{ status }] = await db.select({ status: lots.status }).from(lots).where(eq(lots.lotRef, lotRef));
        if (status !== 'Available') {
            throw new Error(msg.LOT_NOT_AVAILABLE);
        }
        return status
    };

    static getInstance() {
        if (!LotValidator.instance) {
            LotValidator.instance = new LotValidator();
        }
        return LotValidator.instance;
    }
}