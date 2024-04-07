DO $$ BEGIN
 CREATE TYPE "ExpenseType" AS ENUM('Permits_and_Authorizations', 'Development_Work', 'Marketing_and_Advertising', 'Property_Taxes_and_Duties', 'Labor', 'Miscellaneous');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "LotStatus" AS ENUM('Available', 'Reserved', 'Ongoing', 'Sold', 'Canceled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "PaymentMethod" AS ENUM('Cheque', 'Espece', 'CreditCard', 'BankTransfer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "PaymentStatus" AS ENUM('Pending', 'Verified', 'Failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "SaleStatus" AS ENUM('Initiated', 'Ongoing', 'Completed', 'Canceled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customers" (
	"customerId" text PRIMARY KEY NOT NULL,
	"firstName" varchar(100) NOT NULL,
	"lastName" varchar(100) NOT NULL,
	"gender" varchar(100),
	"birthday" varchar(100),
	"phone" varchar(15) NOT NULL,
	"email" varchar(100) NOT NULL,
	"address" text,
	"CIN" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "customers_phone_unique" UNIQUE("phone"),
	CONSTRAINT "customers_email_unique" UNIQUE("email"),
	CONSTRAINT "customers_CIN_unique" UNIQUE("CIN")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expenses" (
	"expenseId" serial PRIMARY KEY NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"beneficiary" text,
	"date" date DEFAULT now(),
	"type" "ExpenseType" DEFAULT 'Miscellaneous' NOT NULL,
	"paymentMethod" text NOT NULL,
	"paymentReference" text,
	"paymentImage" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lots" (
	"lotId" serial PRIMARY KEY NOT NULL,
	"lotRef" varchar(15) NOT NULL,
	"status" "LotStatus" DEFAULT 'Available' NOT NULL,
	"size" text NOT NULL,
	"pricePerM2" text NOT NULL,
	"zoningCode" text NOT NULL,
	"description" text,
	CONSTRAINT "lots_lotRef_unique" UNIQUE("lotRef")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"paymentId" serial PRIMARY KEY NOT NULL,
	"saleId" integer,
	"amount" numeric(10, 2) NOT NULL,
	"date" date DEFAULT now(),
	"method" "PaymentMethod" DEFAULT 'BankTransfer' NOT NULL,
	"paymentReference" text,
	"status" "PaymentStatus" DEFAULT 'Pending',
	"receipt" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "permissions" (
	"permissionId" serial PRIMARY KEY NOT NULL,
	"permissionName" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"roleId" serial PRIMARY KEY NOT NULL,
	"roleName" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles_permissions" (
	"roleId" integer NOT NULL,
	"permissionId" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sales" (
	"saleId" serial PRIMARY KEY NOT NULL,
	"lotId" integer,
	"customerId" text NOT NULL,
	"totalPrice" numeric(10, 2),
	"balanceDue" numeric(10, 2),
	"paidPercentage" numeric(10, 2),
	"date" date DEFAULT now(),
	"status" "SaleStatus" DEFAULT 'Initiated' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"refreshToken" text NOT NULL,
	"refreshExpires" timestamp NOT NULL,
	"tokenType" text DEFAULT 'Bearer',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tokens_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false,
	"image" text,
	"status" text DEFAULT 'Inactive',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"roleId" integer
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_saleId_sales_saleId_fk" FOREIGN KEY ("saleId") REFERENCES "sales"("saleId") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roles_permissions" ADD CONSTRAINT "roles_permissions_roleId_roles_roleId_fk" FOREIGN KEY ("roleId") REFERENCES "roles"("roleId") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roles_permissions" ADD CONSTRAINT "roles_permissions_permissionId_permissions_permissionId_fk" FOREIGN KEY ("permissionId") REFERENCES "permissions"("permissionId") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales" ADD CONSTRAINT "sales_lotId_lots_lotId_fk" FOREIGN KEY ("lotId") REFERENCES "lots"("lotId") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales" ADD CONSTRAINT "sales_customerId_customers_customerId_fk" FOREIGN KEY ("customerId") REFERENCES "customers"("customerId") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tokens" ADD CONSTRAINT "tokens_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_roleId_roles_roleId_fk" FOREIGN KEY ("roleId") REFERENCES "roles"("roleId") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
