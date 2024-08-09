import { sendSuccess, sendError, withErrorHandler } from '../../services/responseHandler';
import LotValidator from '../../Validators/subdivision/LotValidator';

import {parseCSVFile} from '../../lib/utils';
import LotDb from '../../repositories/LotDb';
import { msg } from '../../lib/constants/constants';
import path from 'path';
import fs from 'fs';

const lotValidator = new LotValidator()

const LotController = {
    //===================== many lots actions ======================//
    getAllLots: withErrorHandler(async (req, res) => {
        const allLots = await LotDb.findAllLots();
        return sendSuccess(res, allLots, msg.LOTS_RETRIEVED_SUCCESS);
    }),

    getLotsMap: withErrorHandler(async (req, res) => {
        const allLots = await LotDb.findLotMap();
        return sendSuccess(res, allLots, msg.LOTS_RETRIEVED_SUCCESS);
    }),

    getLotsMapLandingPage: withErrorHandler(async (req, res) => {
        const allLots = await LotDb.findLotLandingPage();
        return sendSuccess(res, allLots, msg.LOTS_RETRIEVED_SUCCESS);
    }),

    deleteAllLots: withErrorHandler(async (req, res) => {
        await LotDb.deleteAllLots();
        await LotDb.resetSequence();
        return sendSuccess(res, null, msg.LOTS_DELETED_SUCCESS);
    }),
    //===============================================================//

    createLot: withErrorHandler(async (req, res) => {
        const lotDetail = req.body;
        await lotValidator.validateLotSchema(lotDetail);
        await lotValidator.checkLotRefExists(lotDetail.lotRef);
        const newLot = await LotDb.createLot(lotDetail);
        return sendSuccess(res, newLot, msg.LOT_CREATED_SUCCESS, 201);
    }),

    updateLot: withErrorHandler(async (req, res) => {

        const lotId = req.params.id;
        const lotDetails = req.body;
        const existingLot = await lotValidator.checkLotExists(lotId);

        if (lotDetails.ref) {
            await lotValidator.checkLotRefExists(lotDetails.lotRef, lotId);
        }
        const updatedLotDetails = { ...existingLot, ...lotDetails };
        const updatedLot = await LotDb.updateLot(lotId, updatedLotDetails);
        return sendSuccess(res, updatedLot, msg.LOT_UPDATED_SUCCESS);
    }),

    getLotById: withErrorHandler(async (req, res) => {
        const lotId = req.params.id;
        const lot = await lotValidator.checkLotExists(lotId)
        return sendSuccess(res, lot, msg.LOT_RETRIEVED_SUCCESS);
    }),

    deleteLotById: withErrorHandler(async (req, res) => {
        const lotId = req.params.id;
        await lotValidator.checkLotExists(lotId);
        const lot = await LotDb.deleteLotById(lotId);
        await LotDb.resetSequence();
        return sendSuccess(res, lot, msg.LOT_DELETED_SUCCESS);
    }),

    initializeLots: withErrorHandler(async (req, res) => {
        const lotsPath = path.join(__dirname, '../config', 'lots.json');
        const lotsData = JSON.parse(fs.readFileSync(lotsPath, 'utf8'));

        let addedLots = [];
        let skippedLots = [];

        for (const lot of lotsData) {
            try {
                await lotValidator.validateLotSchema(lot);
                await lotValidator.checkLotRefExists(lot.lotRef, null);
                const newLot = await LotDb.createLot(lot);
                addedLots.push(newLot);
            }
            catch (error) {
                if (error.message.includes(msg.LOT_EXISTS)) {
                    skippedLots.push({ lot, reason: error.message });
                    continue;
                }
                throw error;
            }
        }

        return sendSuccess(res, { addedLots, skippedLots }, msg.LOTS_INIT_SUCCESS);
    }),

    bulkAddLotsFromCSV: withErrorHandler(async (req, res) => {
        const filePath = req.body.path; 

        if (!filePath || !fs.existsSync(filePath)) {
            return sendError(res, 'Invalid or missing file path', 400);
        }

        try {
            const lotsData:any = await parseCSVFile(filePath);

            let addedLots = [];
            let skippedLots = [];

            for (const lot of lotsData) {
                try {
                    await lotValidator.validateLotSchema(lot);
                    await lotValidator.checkLotRefExists(lot.lotRef, null);
                    const newLot = await LotDb.createLot(lot);
                    addedLots.push(newLot);
                } catch (error) {
                    if (error.message.includes(msg.LOT_EXISTS)) {
                        skippedLots.push({ lot, reason: error.message });
                        continue;
                    }
                    throw error;
                }
            }

            return sendSuccess(res, { addedLots, skippedLots }, msg.LOTS_INIT_SUCCESS);
        } catch (error) {
            return sendError(res, error.message);
        }
    }),

};

export default LotController;



