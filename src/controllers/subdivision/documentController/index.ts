import { formatNumber, formatDate } from '../../../lib/utils';
import { format } from 'date-fns';
import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import saleDb from '../SaleController/SaleDb';
import fileDb from '../../storage/fileController/fileDb';
import asyncHandler from '../../../lib/asyncHandler';
import path from 'path';
import SaleValidator from '../../../services/subdivision/SaleValidator';
import CustomerValidator from '../../../services/subdivision/CustomerValidator';
import LotValidator from '../../../services/subdivision/LotValidator';
import StorageManager from '../../../services/storage/StorageManager';
import { sendSuccess, sendError } from '../../../services/responseHandler';
import { msg } from '../../../lib/constants';
import nodemailer from 'nodemailer';

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

    const { customerId, name, phone, email, address, CIN } = customer;
    const { lotRef, size, zoningCode, pricePerM2 } = lot;
    const { totalPrice } = sale;

    return {
        customerId,
        name,
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

const saveDocument = async (data, customerId, filename) => {

    const outputPath = path.join(process.cwd(), 'storage', 'agreements', `${filename}.docx`);
    const buffer = generateDocument(data);
    await fileDb.deleteFileById(customerId);

    fs.writeFileSync(outputPath, buffer);
    const fileInfo = fs.statSync(outputPath);

    return await fileDb.insertFile({
        id: customerId,
        parentId: '77777777-7777-7777-7777-777777777777',
        filename,
        path: await storageManager.getRelativePath(outputPath),
        name: filename,
        type: 'docx',
        icon: 'doc.png',
        category: 'file',
        size: fileInfo.size,
    });
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
        const { customerId, lotRef, name } = preparedData;
        const filename = `${name}_${lotRef}_agreement`;

        const file = await saveDocument(preparedData, customerId, filename);
        sendSuccess(res, file, msg.AGREEMENT_DOWNLOAD_SUCCESS);
    }),

    sendAgreementByMail: asyncHandler(async (req, res) => {
        const saleId = req.params.id;
        const preparedData = await prepareSaleData(saleId);
        const { customerId, lotRef, name } = preparedData;
        const filename = `${name}_${lotRef}_agreement`;

        const buffer = generateDocument(preparedData);
        await sendMailWithAttachment(filename, buffer);
        sendSuccess(res, null, msg.AGREEMENT_EMAIL_SUCCESS);
    }),
};

export default DocumentController;
