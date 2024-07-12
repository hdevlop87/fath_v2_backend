import { formatNumber, formatDate } from '../../lib/utils';
import { format } from 'date-fns';
import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import saleDb from '../../repositories/SaleDb';
import fileDb from '../../repositories/fileDb';
import asyncHandler from '../../lib/asyncHandler';
import path from 'path';
import SaleValidator from '../../services/subdivision/SaleValidator';
import CustomerValidator from '../../services/subdivision/CustomerValidator';
import LotValidator from '../../services/subdivision/LotValidator';
import StorageManager from '../../services/storage/StorageManager';
import { sendSuccess } from '../../services/responseHandler';
import { msg } from '../../lib/constants';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import AgreementDb from '../../repositories/AgreementDb';
import FolderDb from '../../repositories/folderDb'

const saleValidator = new SaleValidator();
const customerValidator = new CustomerValidator();
const lotValidator = new LotValidator();
const storageManager = new StorageManager();

const prepareSaleData = async (saleId) => {
    const sale = await saleValidator.checkSaleExists(saleId);
    const customer = await customerValidator.checkCustomerExists(sale.customerId);
    const lot = await lotValidator.checkLotExists(sale.lotId);
    const payments = await saleDb.findAllPaymentsBySaleId(saleId);

    const newPayments = payments.map((payment, index) => ({
        index: index + 1,
        amount: formatNumber(payment.amount),
        date: formatDate(payment.date),
        paymentReference: payment.paymentReference,
    }));

    const { customerId, firstName, lastName, phone, email, address, CIN } = customer;
    const { lotRef, size, zoningCode, pricePerM2 } = lot;
    const { totalPrice } = sale;

    return {
        customerId,
        firstName,
        lastName,
        phone,
        email,
        address,
        CIN,
        lotRef,
        size: formatNumber(size),
        zoningCode,
        totalPrice: formatNumber(totalPrice),
        pricePerM2: formatNumber(pricePerM2),
        timeStamp: format(new Date(), 'yyyy-MM-dd'),
        payments: newPayments,
        saleId
    };
};

const generateDocument = (data) => {
    const basePath = storageManager.basePath;
    const filePath = path.join(basePath, 'home', 'agreement.docx');
    const content = fs.readFileSync(filePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater();
    doc.loadZip(zip);

    doc.setData(data);
    doc.render();

    return doc.getZip().generate({ type: 'nodebuffer' });
};

const saveDocument = async (data, filename) => {

    const { customerId, saleId } = data
    const parentFolderPath = await FolderDb.getFolderPath(customerId)
    const outputPath = path.join(parentFolderPath, `${filename}.docx`);
    const buffer = generateDocument(data);

    const file = await fileDb.insertFile({
        id: uuidv4(),
        parentId: customerId,
        filename,
        path: outputPath,
        name: filename,
        type: 'docx',
        icon: 'doc.png',
        category: 'file',
        size: "1Mb",
    });

    await AgreementDb.createAgreement({
        agreementId: uuidv4(),
        saleId: saleId,
        fileId: file.id,
    });

    fs.writeFileSync(outputPath, buffer);
    return file;
};

const sendMailWithAttachment = async (name, buffer) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'lotissement.sb@gmail.com',
            pass: 'bvhmjhtzktsqrwcs',
        },
    });

    let mailOptions = {
        from: 'lotissement.sb@gmail.com',
        to: 'lotissement.sb@gmail.com',
        subject: 'Compromis de vente',
        text: `Veuillez trouver ci-joint le fichier du compromis de vente de Mr (Mme): ${name}`,
        attachments: [
            {
                filename: name,
                content: buffer,
            },
        ],
    };

    await transporter.sendMail(mailOptions);
};

const DocumentController = {
    downloadAgreement: asyncHandler(async (req, res) => {
        const saleId = req.params.id;
        const preparedData = await prepareSaleData(saleId);
        const { lotRef, firstName, lastName } = preparedData;
        const filename = `${firstName}_${lastName}_${lotRef}_agreement`;

        const file = await saveDocument(preparedData, filename);
        sendSuccess(res, file, msg.AGREEMENT_DOWNLOAD_SUCCESS);
    }),

    sendAgreementByMail: asyncHandler(async (req, res) => {
        const saleId = req.params.id;
        const preparedData = await prepareSaleData(saleId);
        const { lotRef, firstName, lastName } = preparedData;
        const filename = `${firstName}_${lastName}_${lotRef}_agreement`;

        const buffer = generateDocument(preparedData);
        await sendMailWithAttachment(filename, buffer);
        sendSuccess(res, null, msg.AGREEMENT_EMAIL_SUCCESS);
    }),
};

export default DocumentController;
