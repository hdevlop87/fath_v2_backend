import { db } from '../../db/index';
import { eq, sql } from "drizzle-orm";
import { customers } from '../../db/schema';

const customerDb = {
    findAllCustomers: async () => {
        return await db.select().from(customers);
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
