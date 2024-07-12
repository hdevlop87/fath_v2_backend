import { sendSuccess, sendError } from '../../services/responseHandler';
import asyncHandler from '../../lib/asyncHandler';
import { settings } from '../../db/schema';
import { msg } from '../../lib/constants';
import { eq, sql } from "drizzle-orm";
import { db } from '../../db/index';

const SettingController = {

    getSettings: asyncHandler(async (req, res) => {

        const [data] = await db.select().from(settings).where(eq(settings.id, 1));

        sendSuccess(res, data, msg.PAYMENTS_RETRIEVED_SUCCESS);
    }),

}

export default SettingController


