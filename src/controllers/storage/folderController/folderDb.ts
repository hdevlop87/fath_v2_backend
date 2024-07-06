import { folders, files } from "../../../db/schema";
import { eq, sql, like,inArray } from "drizzle-orm";
import { db } from "../../../db/index";
import { promises as fs } from 'fs';

const FolderDb = {
   
   insertFolder: async (folderDetails) => {
      const [newFolder] = await db
         .insert(folders)
         .values(folderDetails)
         .returning();
      return newFolder;
   },

   updateFolder: async (id, folderDetails) => {
      const [updatedFolder] = await db
         .update(folders)
         .set(folderDetails)
         .where(eq(folders.id, id))
         .returning();
      return updatedFolder;
   },

   updateFolderPath: async (id, newPath) => {
      const [updatedFolder] = await db
         .update(folders)
         .set({ path: newPath })
         .where(eq(folders.id, id))
         .returning();
      return updatedFolder;
   },

   //======================================================//

   findFoldersByParentId: async (id) => {
      return await db
         .select()
         .from(folders)
         .where(eq(folders.parentId, id))
         .orderBy(folders.createdAt);
   },

   findFolderById: async (id) => {
      const [folder] = await db.select().from(folders).where(eq(folders.id, id));
      return folder;
   },

   findFolderByPath: async (path) => {
      const [folder] = await db
         .select()
         .from(folders)
         .where(eq(folders.path, path));
      return folder;
   },

   findAllChildrenByPath: async (path) => {
      const normalizedPath = path.replace(/\\/g, "\\\\");

      const folderResults = await db
         .select({
            id: folders.id,
            name: folders.name,
            type: sql`'folder'`,
            path: folders.path,
            parentId: folders.parentId,
         })
         .from(folders)
         .where(like(folders.path, `${normalizedPath}%`));

      const fileResults = await db
         .select({
            id: files.id,
            name: files.filename,
            type: files.type,
            path: files.path,
            parentId: files.parentId,
         })
         .from(files)
         .where(like(files.path, `${normalizedPath}%`));

      return [...folderResults, ...fileResults];
   },

   findAllFolders: async () => {
      const results = await db
         .select({
            id: folders.id,
            name: folders.name,
            maxSize: folders.maxSize,
            password: folders.password,
            isLocked: folders.isLocked,
            filesCount: sql`COUNT(${files.id})`,
            size: sql`SUM(CAST(${files.size} AS BIGINT))`,
            path: folders.path,
            updatedAt: folders.updatedAt,
            parentId: folders.parentId,
         })
         .from(folders)
         .leftJoin(files, eq(folders.id, files.parentId))
         .groupBy(folders.id);

      return results.map((folder) => ({
         ...folder,
         filesCount: folder.filesCount || 0,
         size: folder.size || 0,
      }));
   },

   findFoldersByIds: async (ids) => {
      const foldersList = await db
         .select()
         .from(folders)
         .where(inArray(folders.id, ids));
      return foldersList;
   },

   //=========================================================//

   deleteFolderByPath: async (path) => {
      const [deletedFolder] = await db
         .delete(folders)
         .where(eq(folders.path, path))
         .returning();

      if (deletedFolder) {
         const folderPath = deletedFolder.path;
         await db.delete(files).where(eq(files.parentId, deletedFolder.id));
         await fs.rm(folderPath, { recursive: true, force: true });
      }

      return deletedFolder;
   },

   deleteAllFolders: async () => {
      const deletedFolders = await db
         .delete(folders)
         .returning();

      for (const folder of deletedFolders) {
         const folderPath = folder.path;
         await db.delete(files).where(eq(files.parentId, folder.id));
         await fs.rm(folderPath, { recursive: true, force: true });
      }

      return deletedFolders;
   },

   deleteFolderById: async (id) => {
      const [deletedFolder] = await db
         .delete(folders)
         .where(eq(folders.id, id))
         .returning();

      if (deletedFolder) {
         const folderPath = deletedFolder.path;
         await db.delete(files).where(eq(files.parentId, id));
         await fs.rm(folderPath, { recursive: true, force: true });
      }

      return deletedFolder;
   },
   //========================================================//

   folderExists: async (folderName, parentId = null) => {
      let conditions =
         parentId === null
            ? sql`(${folders.name} = ${folderName} AND ${folders.parentId} IS NULL)`
            : sql`(${folders.name} = ${folderName} AND ${folders.parentId} = ${parentId})`;

      const existingFolder = await db.select().from(folders).where(conditions);
      return existingFolder.length > 0;
   },

   folderExistsByPath: async (path) => {
      const [existingFolder] = await db
         .select()
         .from(folders)
         .where(eq(folders.path, path));
      return !!existingFolder;
   },

};

export default FolderDb;
