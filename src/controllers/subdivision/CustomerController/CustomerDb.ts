import { db } from '../../../db/index';
import { eq, sql } from "drizzle-orm";
import { customers, lots, sales } from '../../../db/schema';

const customerDb = {
    findAllCustomers: async () => {
        const result = await db
            .select({
                customerId: customers.customerId,
                firstName: customers.firstName,
                lastName: customers.lastName,
                gender:customers.gender,
                birthday:customers.birthday,
                phone: customers.phone,
                address: customers.address,
                email: customers.email,
                CIN: customers.CIN,
                image:customers.image,
                lotRefs: sql`array_agg(${lots.lotRef})`
            })
            .from(customers)
            .leftJoin(sales, eq(customers.customerId, sales.customerId))
            .leftJoin(lots, eq(sales.lotId, lots.lotId))
            .groupBy(customers.customerId);

        return result;
    },

    deleteAllCustomers: async () => {
        return await db.delete(customers);
    },

    findCustomerById: async (customerId) => {
        return await db.select().from(customers).where(eq(customers.customerId, customerId));
    },

    findCustomerByCIN: async (CIN) => {
        const [customer] = await db.select().from(customers).where(eq(customers.CIN, CIN));
        return customer
    },

    findCustomerByPhone: async (phone) => {
        const [customer] = await db.select().from(customers).where(eq(customers.phone, phone));
        return customer;
    },

    createCustomer: async (customerDetail) => {
        const [newCustomer] = await db.insert(customers).values(customerDetail).returning();
        return newCustomer;
    },

    updateCustomer: async (customerId, customerDetails) => {
        const [updatedCustomer] = await db.update(customers)
            .set(customerDetails)
            .where(eq(customers.customerId, customerId))
            .returning();
        return updatedCustomer;
    },

    deleteCustomerById: async (customerId) => {
        const [customer] = await db.delete(customers)
            .where(eq(customers.customerId, customerId))
            .returning();
        return customer;
    }
};

export default customerDb;
