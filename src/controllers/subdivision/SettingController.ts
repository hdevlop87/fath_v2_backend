import { sendSuccess, sendError, withErrorHandler } from '../../services/responseHandler';

import { settings } from '../../db/schema';
import { msg } from '../../lib/constants/constants';
import { eq, sql } from "drizzle-orm";
import { db } from '../../db/index';

const SettingController = {

    getSettings: withErrorHandler(async (req, res) => {

        const [data] = await db.select().from(settings).where(eq(settings.id, 1));

        return sendSuccess(res, data, msg.PAYMENTS_RETRIEVED_SUCCESS);
    }),

}

export default SettingController


