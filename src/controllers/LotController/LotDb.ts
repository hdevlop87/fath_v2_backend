import { msg } from '../../lib/constants'
import { lots } from '../../db/schema';
import { eq, sql } from "drizzle-orm";
import { db } from '../../db/index';

const lotDb = {

    findAllLots: async () => {
        return await db.select().from(lots);
    },

    deleteAllLots: async () => {
        return await db.delete(lots);
    },

    resetAllLots: async () => {
        const resetData: any = {status: msg.AVAILABLE };
        return await db.update(lots).set(resetData).returning();
    },

    resetLot: async (lotId) => {
        const resetData = { status: msg.AVAILABLE };
        const updatedSale = await lotDb.updateLot(lotId, { ...resetData });
        return updatedSale;
    },

    createLot: async (lotDetail) => {
        const [newLot] = await db.insert(lots).values(lotDetail).returning();
        return newLot;
    },

    updateLot: async (lotId, lotDetails) => {
        const [updatedLot] = await db.update(lots)
            .set(lotDetails)
            .where(eq(lots.lotId, lotId))
            .returning();
        return updatedLot;
    },

    getLotById: async (lotId) => {
        return await db.select().from(lots).where(eq(lots.lotId, lotId));
    },

    getLotSize: async (lotId) => {
        const [{ size }] = await db.select({ size: lots.size }).from(lots).where(eq(lots.lotId, lotId));
        return size
    },

    getLotStatus: async (lotId) => {
        const [{ status }] = await db.select({ status: lots.status }).from(lots).where(eq(lots.lotId, lotId));
        return status
    },

    getLotPricePerM2: async (lotId) => {
        const [{ pricePerM2 }] = await db.select({ pricePerM2: lots.pricePerM2 }).from(lots).where(eq(lots.lotId, lotId));
        return pricePerM2
    },

    deleteLotById: async (lotId) => {
        const [lot] = await db.delete(lots)
            .where(eq(lots.lotId, lotId))
            .returning();
        return lot;
    },

    updateLotStatus: async (lotId, status) => {
        await lotDb.updateLot(lotId, { status })
    },

    setOrphanedLotsAvailable: async () => {
        const query = sql`
            UPDATE lots
            SET status = 'Available'
            WHERE "lotId" NOT IN (
                SELECT DISTINCT "lotId"
                FROM sales
            ) 
            AND status != 'Available';
        `;
        await db.execute(query);
    },

    updateLotStatusBasedSale: async (sale) => {
     
        const lotId = sale.lotId;
        const saleStatus = sale.status;
        let newLotStatus = '';

        switch (saleStatus) {
            case msg.INITIATED:
                newLotStatus = msg.RESERVED;
                break;
            case msg.ONGOING:
                newLotStatus = msg.ONGOING;
                break;
            case msg.COMPLETED:
                newLotStatus =  msg.SOLD;
                break;
            case msg.CANCELED:
                newLotStatus = msg.CANCELED;
                break;
        }

        await lotDb.updateLotStatus(lotId, newLotStatus);
},

    resetSequence: async () => {
        try {
            const query = sql`SELECT setval(pg_get_serial_sequence('lots', 'lotId'), COALESCE((SELECT MAX("lotId") + 1 FROM lots), 1), false)`;
            await db.execute(query);
        } catch (error) {
            throw new Error('Error resetting sequence');
        }
    }
};

export default lotDb;
