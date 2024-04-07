import { sendSuccess } from '../../services/responseHandler';
import LotValidator from '../../services/LotValidator';
import asyncHandler from '../../lib/asyncHandler'
import { msg } from '../../lib/constants';
import lotDb from './LotDb'
import path from 'path';
import fs from 'fs';

const lotValidator = new LotValidator()

const LotController = {
    //===================== many lots actions ======================//
    getAllLots: asyncHandler(async (req, res) => {
        const allLots = await lotDb.findAllLots();
        sendSuccess(res, allLots, msg.LOTS_RETRIEVED_SUCCESS);
    }),

    deleteAllLots: asyncHandler(async (req, res) => {
        await lotDb.deleteAllLots();
        await lotDb.resetSequence();
        sendSuccess(res, null, msg.LOTS_DELETED_SUCCESS);
    }),
    //===============================================================//

    createLot: asyncHandler(async (req, res) => {
        const lotDetail = req.body;
        await lotValidator.validateLotSchema(lotDetail);
        await lotValidator.checkLotRefExists(lotDetail.lotRef);
        const newLot = await lotDb.createLot(lotDetail);
        sendSuccess(res, newLot, msg.LOT_CREATED_SUCCESS, 201);
    }),

    updateLot: asyncHandler(async (req, res) => {
        /**
         * Handles the update of a lot based on the provided lot ID and details.
         * Fetch existing lot details from the database based on the lot ID
         * Merge existing lot details with incoming lotDetails
         * Check if lot reference exists in lotDetails and if it does, ensure it's unique
         * Update the lot with the merged updatedLotDetails
         * Send success response with the updated lot data
         */
        const lotId = req.params.id;
        const lotDetails = req.body;
        const existingLot = await lotValidator.checkLotExists(lotId);

        if (lotDetails.ref) {
            await lotValidator.checkLotRefExists(lotDetails.lotRef, lotId);
        }
        const updatedLotDetails = { ...existingLot, ...lotDetails };
        const updatedLot = await lotDb.updateLot(lotId, updatedLotDetails);
        sendSuccess(res, updatedLot, msg.LOT_UPDATED_SUCCESS);
    }),

    getLotById: asyncHandler(async (req, res) => {
        const lotId = req.params.id;
        const lot = await lotValidator.checkLotExists(lotId)
        sendSuccess(res, lot, msg.LOT_RETRIEVED_SUCCESS);
    }),

    deleteLotById: asyncHandler(async (req, res) => {
        const lotId = req.params.id;
        await lotValidator.checkLotExists(lotId);
        const lot = await lotDb.deleteLotById(lotId);
        await lotDb.resetSequence();
        sendSuccess(res, lot, msg.LOT_DELETED_SUCCESS);
    }),

    initializeLots: asyncHandler(async (req, res) => {
        const lotsPath = path.join(__dirname, '../config', 'lots.json');
        const lotsData = JSON.parse(fs.readFileSync(lotsPath, 'utf8'));

        let addedLots = [];
        let skippedLots = [];

        for (const lot of lotsData) {
            try {
                await lotValidator.validateLotSchema(lot);
                await lotValidator.checkLotRefExists(lot.lotRef, null);
                const newLot = await lotDb.createLot(lot);
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

        sendSuccess(res, { addedLots, skippedLots }, msg.LOTS_INIT_SUCCESS);
    }),

};

export default LotController;



