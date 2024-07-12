import { eq, sql, and } from "drizzle-orm";
import { db } from '../../db/index';
import { customers } from '../../db/schema';
import Joi from 'joi';
import { msg } from '../../lib/constants';

export default class CustomerValidator {

    static instance = null;
    customerSchema: Joi.ObjectSchema<any>;
    userCustomerSchema: Joi.ObjectSchema<any>;

    constructor() {
        if (CustomerValidator.instance) {
            return CustomerValidator.instance;
        }
        this.customerSchema = Joi.object({
            customerId: Joi.string().optional(),
            lastName: Joi.string().max(100).required(),
            firstName: Joi.string().max(100).required(),
            gender: Joi.string().max(100).optional(),
            birthday: Joi.string().max(100).optional(),
            phone: Joi.string().max(15).required(),
            address: Joi.string().allow('').optional(),
            CIN: Joi.string().max(50).required(),
            email: Joi.optional(),
            image: Joi.string().optional(),
            file: Joi.any().optional(),
        });

        CustomerValidator.instance = this;
    }


    async validateCustomerSchema(data) {
        try {
            await this.customerSchema.validateAsync(data);
        }
        catch (error) {
            if (error instanceof Joi.ValidationError) {
                throw new Error(error.details[0].message);
            } else {
                throw error;
            }
        }
    }

    async checkCustomerExists(customerId) {
        const [existingCustomer] = await db.select().from(customers).where(eq(customers.customerId, customerId));
        if (!existingCustomer) {
            throw new Error(msg.CUSTOMER_NOT_FOUND);
        }
        return existingCustomer;
    }

    async checkEmailExists(email, customerId = null) {
        const query = customerId
            ? sql`${customers.customerId} != ${customerId} AND ${customers.email} = ${email}`
            : sql`${customers.email} = ${email}`;

        const [existingCustomer] = await db.select().from(customers).where(query);

        if (existingCustomer) {
            throw new Error(msg.EMAIL_EXISTS);
        }

        return existingCustomer;
    }

    async checkPhoneExists(phone, customerId = null) {
        const query = customerId
            ? sql`${customers.customerId} != ${customerId} AND ${customers.phone} = ${phone}`
            : sql`${customers.phone} = ${phone}`;

        const [existingCustomer] = await db.select().from(customers).where(query);
        if (existingCustomer) {
            throw new Error(msg.PHONE_EXISTS);
        }

        return existingCustomer;
    }

    async checkCINExists(CIN, customerId = null) {
        const query = customerId
            ? sql`${customers.customerId} != ${customerId} AND ${customers.CIN} = ${CIN}`
            : sql`${customers.CIN} = ${CIN}`;

        const [existingCustomer] = await db.select().from(customers).where(query);
        if (existingCustomer) {
            throw new Error(msg.CIN_EXISTS);
        }

        return existingCustomer;
    }

    static getInstance() {
        if (!CustomerValidator.instance) {
            CustomerValidator.instance = new CustomerValidator();
        }
        return CustomerValidator.instance;
    }
}



