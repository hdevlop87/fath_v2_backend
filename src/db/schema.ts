import { timestamp, pgTable, text, varchar, integer, boolean, serial, numeric, date, primaryKey, pgEnum } from "drizzle-orm/pg-core";

export const userStatusEnum = pgEnum('userStatus', ['Active', 'Inactive', 'Pending']);
export const LotStatusEnum = pgEnum('LotStatus', ['Available', 'Reserved','Ongoing', 'Sold', 'Canceled']);
export const PaymentMethodEnum = pgEnum('PaymentMethod', ['Cheque', 'Espece', 'CreditCard', 'BankTransfer']);
export const SaleStatusEnum = pgEnum('SaleStatus', ['Initiated', 'Ongoing', 'Completed', 'Canceled']);
export const PaymentStatusEnum = pgEnum('PaymentStatus', ['Pending', 'Verified', 'Failed']);
export const ExpenseTypeEnum = pgEnum('ExpenseType', [
    'Permits_and_Authorizations', 
    'Development_Work',  
    'Marketing_and_Advertising', 
    'Property_Taxes_and_Duties', 
    'Labor', 
    'Miscellaneous'
]);

//============================= Authentication service =====================================//

export const users = pgTable("users", {
    id: text("id").notNull().primaryKey(),
    name: text("name").notNull(),
    username: text("username").notNull(),
    password: text("password"),
    email: text("email").notNull(),
    emailVerified: boolean("emailVerified").default(false),
    image: text("image"),
    status: userStatusEnum("status").default('Active'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    roleId: integer("roleId").references(() => roles.roleId, { onDelete: 'set null' }),
});

export const roles = pgTable("roles", {
    roleId: serial("roleId").primaryKey(),
    roleName: text("roleName").notNull(),
    description: text("description"),
});

export const permissions = pgTable("permissions", {
    permissionId: serial("permissionId").primaryKey(),
    permissionName: text("permissionName").notNull(),
    description: text("description"),
});

export const rolesPermissions = pgTable("roles_permissions", {
    roleId: integer("roleId").notNull().references(() => roles.roleId, { onDelete: 'cascade' }),
    permissionId: integer("permissionId").notNull().references(() => permissions.permissionId, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
});

export const tokens = pgTable("tokens", {
    id: text("id").notNull().primaryKey(),
    userId: text("userId").notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
    refreshToken: text("refreshToken").notNull(),
    refreshExpires: timestamp("refreshExpires").notNull(),
    tokenType: text("tokenType").default('Bearer'),
    createdAt: timestamp('created_at').defaultNow(),
});

//=========================================================================================//

export const customers = pgTable("customers", {
    customerId: text("customerId").notNull().primaryKey(),
    firstName: text("firstName").notNull(),
    lastName: text("lastName").notNull(),
    gender: varchar("gender", { length: 100 }),
    birthday: varchar("birthday", { length: 100 }),
    phone: varchar("phone", { length: 15 }).unique().notNull(),
    email: varchar("email", { length: 100 }),
    address: text("address"),
    CIN: varchar("CIN", { length: 50 }).unique().notNull(),
    image: text("image").default("noavatar.png"),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const lots = pgTable("lots", {
    lotId: serial("lotId").primaryKey(),
    lotRef: varchar("lotRef", { length: 15 }).unique().notNull(),
    status: LotStatusEnum("status").default('Available'),
    size: text("size").notNull(),
    pricePerM2: text("pricePerM2").default('3000'),
    zoningCode: text("zoningCode").notNull(),
    description: text("description"),
});

export const sales = pgTable("sales", {
    saleId: serial("saleId").primaryKey(),
    lotId: integer("lotId").references(() => lots.lotId, { onDelete: 'cascade' }),
    customerId: text("customerId").notNull().references(() => customers.customerId, { onDelete: 'cascade' }),
    totalPrice: numeric("totalPrice", { precision: 10, scale: 2 }),
    totalVerifiedPayments: numeric("totalVerifiedPayments", { precision: 10, scale: 2 }),
    balanceDue: numeric("balanceDue", { precision: 10, scale: 2 }),
    paidPercentage: numeric("paidPercentage", { precision: 10, scale: 2 }),
    date: date("date").defaultNow(),
    status: SaleStatusEnum("status").notNull().default('Initiated'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const payments = pgTable("payments", {
    paymentId: serial("paymentId").primaryKey(),
    saleId: integer("saleId").references(() => sales.saleId, { onDelete: 'cascade' }),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    date: date("date").defaultNow(),
    method: PaymentMethodEnum("method").notNull().default('BankTransfer'),
    paymentReference: text("paymentReference"),
    status: PaymentStatusEnum("status").default('Pending'),
    receipt: text("receipt"),
    notes: text("notes"),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const expenses = pgTable("expenses", {
    expenseId: serial("expenseId").primaryKey().notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    beneficiary: text("beneficiary"),
    date: date("date").defaultNow(),
    type: ExpenseTypeEnum("type").notNull().default('Miscellaneous'),
    method: text("method").notNull(),
    reference: text("reference"),
    receipt: text("receipt"),
    notes: text("notes"),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const agreements = pgTable("agreements", {
    agreementId: text("agreementId").notNull().primaryKey(),
    saleId: integer("saleId").notNull().references(() => sales.saleId, { onDelete: 'cascade' }),
    fileId: text("fileId").notNull().references(() => files.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
//============================================================================//

export const files = pgTable("files", {
    id: text("id").notNull().primaryKey(),
    name: text("name").notNull(),
    fieldname: text("fieldname").default("uploadField"),
    filename: text("filename").notNull(),
    mimetype: text("mimetype").default("application/octet-stream"),
    destination: text("destination"),
    size: text("size").notNull(),
    type: text("type").default("file"),
    icon: text("icon").default("file.png"),
    path: text("path").notNull(),
    encoding: text("encoding").default("binary"),
    password: text("password"),
    isLocked: boolean("isLocked").default(false),
    parentId: text("parentId").references(() => folders.id, { onDelete: 'cascade' }),
    category: text("category").default("image"),
    deletedAt: timestamp('deleted_at').default(null),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const folders = pgTable("folders", {
    id: text("id").notNull().primaryKey(),
    name: text("name").notNull(),
    size: text("size").default("0"),
    type: text("type").default("folder"),
    icon: text("icon").default("folder.png"),
    path: text("path"),
    maxSize: text("maxSize").default("10"),
    password: text("password"),
    isLocked: boolean("isLocked").default(false),
    parentId: text("parentId").references(() => folders.id, { onDelete: 'set null' }),
    category: text("category").default("folder"),
    deletedAt: timestamp('deleted_at').default(null),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const settings = pgTable("settings", {
    id: serial("id").notNull().primaryKey(),
    appName: text("appName").notNull(),
    appLogo: text("appLogoUrl"),
    appLargeLogo: text("appLargeLogoUrl"),
    dbUrl: text("dbUrl"),
    timeZone: text("timeZone"),
    dateFormat: text("dateFormat"),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

//=========================================================================//

