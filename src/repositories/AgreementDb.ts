import { agreements, sales } from '../db/schema';
import { eq, sql } from "drizzle-orm";
import { db } from '../db/index';
import FileDb from './fileDb'

const AgreementDb = {

    findAllAgreements: async () => {
        return await db.select().from(agreements).orderBy(agreements.agreementId);
    },

    findAgreementsBySaleId: async (saleId) => {
        return await db.select()
            .from(agreements)
            .where(eq(agreements.saleId, saleId))
            .orderBy(agreements.agreementId);
    },

    createAgreement: async (agreementDetails) => {
        const [newAgreement] = await db.insert(agreements).values(agreementDetails).returning();
        return newAgreement;
    },

    updateAgreement: async (agreementId, agreementDetails) => {
        const [updatedAgreement] = await db.update(agreements)
            .set(agreementDetails)
            .where(eq(agreements.agreementId, agreementId))
            .returning();
        return updatedAgreement;
    },

    deleteAgreementById: async (agreementId) => {
        const [agreement] = await db.select().from(agreements).where(eq(agreements.agreementId, agreementId));
        await FileDb.deleteFileById(agreement.fileId);
        const [deletedAgreement] = await db.delete(agreements)
            .where(eq(agreements.agreementId, agreementId))
            .returning();
        return deletedAgreement;
    },

    deleteAgreementsBySaleId: async (saleId) => {
        const agreementsToDelete = await db.select().from(agreements).where(eq(agreements.saleId, saleId));
        for (const agreement of agreementsToDelete) {
            await AgreementDb.deleteAgreementById(agreement.agreementId);
        }
        return agreementsToDelete;
    },

    resetSequence: async () => {
        try {
            const query = sql`SELECT setval(pg_get_serial_sequence('agreements', 'agreementId'), COALESCE((SELECT MAX("agreementId") + 1 FROM agreements), 1), false)`;
            await db.execute(query);
        } catch (error) {
            throw new Error('Error resetting sequence');
        }
    }
};

export default AgreementDb;
