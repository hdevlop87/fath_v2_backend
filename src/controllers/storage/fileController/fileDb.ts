import { files } from "../../../db/schema";
import { eq,  desc,  isNull } from "drizzle-orm";
import { db } from "../../../db/index";
import { promises as fs } from 'fs';


const FileDb = {

    insertFile: async (fileDetails) => {
        const [newFile] = await db.insert(files).values(fileDetails).returning();
        return newFile;
    },

    //==============================================//

    updateFile: async (id, fileDetails) => {
        const [updatedFile] = await db
            .update(files)
            .set(fileDetails)
            .where(eq(files.id, id)) 
            .returning();
        return updatedFile;
    },

    updateFilePath: async (id, newPath) => {
        const [updatedFile] = await db
            .update(files)
            .set({ path: newPath })
            .where(eq(files.id, id))
            .returning();
        return updatedFile;
    },

    //==============================================//

    findAllFiles: async () => {
        return await db.select().from(files);
    },

    findFileById: async (id) => {
        const [file] = await db.select().from(files).where(eq(files.id, id));
        return file;
    },

    findFilesByParentId: async (id) => {
        return await db
            .select()
            .from(files)
            .where(eq(files.parentId, id))
            .orderBy(files.createdAt);
    },

    findFileByPath: async (filePath) => {
        const [file] = await db
            .select()
            .from(files)
            .where(eq(files.path, filePath));
        return file;
    },

    findFilesInTrash: async () => {
        return await db.select().from(files);
    },

    findRecentFiles: async () => {
        return await db
            .select()
            .from(files)
            .where(isNull(files.deletedAt))
            .orderBy(desc(files.createdAt))
            .limit(6);
    },

    //============================================//

    fileExists: async (filename) => {
        const [file] = await db
            .select({ id: files.id })
            .from(files)
            .where(eq(files.name, filename));

        return !!file;
    },

    fileExistsByPath: async (filePath) => {
        const [existingFile] = await db
            .select()
            .from(files)
            .where(eq(files.path, filePath));
        return !!existingFile;
    },

    //============================================//

    deleteAllFiles: async () => {
        const deletedFiles = await db
           .delete(files)
           .returning();
  
        for (const file of deletedFiles) {
           await fs.rm(file.path, { force: true });
        }
  
        return deletedFiles;
     },
  
     deleteFileById: async (id) => {
        const [deletedFile] = await db
           .delete(files)
           .where(eq(files.id, id))
           .returning();
  
        if (deletedFile) {
           await fs.rm(deletedFile.path, { force: true });
        }
  
        return deletedFile;
     },
  
     deleteFileByPath: async (filePath) => {
        const [deletedFile] = await db
           .delete(files)
           .where(eq(files.path, filePath))
           .returning();
  
        if (deletedFile) {
           await fs.rm(deletedFile.path, { force: true });
        }
  
        return deletedFile;
     },

};

export default FileDb;
