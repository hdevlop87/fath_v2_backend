import { msg } from '../../lib/constants/constants';
import { sql, eq } from "drizzle-orm";
import { files } from '../../db/schema';
import { db } from '../../db/index';
import fileDb from '../../repositories/fileDb';
import folderDb from '../../repositories/folderDb';
import Joi from 'joi';

export default class FileValidator {
    static instance = null;
    fileSchema: Joi.ObjectSchema<any>;

    constructor() {
        if (FileValidator.instance) {
            return FileValidator.instance;
        }
        this.fileSchema = Joi.object({
            filename: Joi.string().required(),
            mimetype: Joi.string().required(),
            name: Joi.string().required(),
            size: Joi.number().required(),
            path: Joi.string().required(),
            id: Joi.string().required()
        });
        FileValidator.instance = this;
    }

    async validateFileSchema(data) {
        try {
            await this.fileSchema.validateAsync(data);
        } catch (error) {
            if (error instanceof Joi.ValidationError) {
                throw new Error(error.details[0].message);
            } else {
                throw error;
            }
        }
    }

    async checkFileExists(id) {
        const file = await fileDb.findFileById(id);
        if (!file) {
            throw new Error(msg.FILE_NOT_FOUND);
        }
        return file;
    }

    async checkFileNameExists(filename, id = null) {
        const query = id
            ? sql`${files.id} != ${id} AND ${files.filename} = ${filename}`
            : sql`${files.filename} = ${filename}`;
            const existingFile = await db.select().from(files).where(query);
        if (existingFile.length > 0) {
            throw new Error(msg.FILE_EXISTS);
        }
    }

    async checkFileExistsByPath(filePath) {
        const file = await fileDb.findFileByPath(filePath);
        if (!file) {
            throw new Error(msg.FILE_NOT_FOUND);
        }
        return file;
    }

    async checkFolderExists(id) {
        const folder = await folderDb.findFolderById(id);
        if (!folder) {
            throw new Error(msg.FOLDER_NOT_FOUND);
        }
        return folder;
    }

    static getInstance() {
        if (!FileValidator.instance) {
            FileValidator.instance = new FileValidator();
        }
        return FileValidator.instance;
    }
}
