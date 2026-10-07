CREATE TYPE "public"."attendance_source" AS ENUM('MANAGER', 'INTEGRATION', 'WORKER_REQUEST');--> statement-breakpoint
CREATE TYPE "public"."attendance_state" AS ENUM('PRESENT', 'OFF');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('WORKER', 'MANAGER', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"date" date NOT NULL,
	"state" "attendance_state" NOT NULL,
	"source" "attendance_source" NOT NULL,
	"note" text,
	"check_in_at" timestamp with time zone,
	"check_out_at" timestamp with time zone,
	"request_id" uuid,
	"marked_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"date" date NOT NULL,
	"type" "attendance_state" NOT NULL,
	"status" "request_status" DEFAULT 'PENDING' NOT NULL,
	"note" text,
	"check_in_at" timestamp with time zone,
	"check_out_at" timestamp with time zone,
	"reviewed_by_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"job_title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"self_check_in_enabled" boolean DEFAULT false NOT NULL,
	"manager_marking_enabled" boolean DEFAULT true NOT NULL,
	"off_days_per_year" integer DEFAULT 12 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"role" "role" NOT NULL,
	"external_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_externalId_unique" UNIQUE("external_id")
);
--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_request_id_attendance_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."attendance_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_marked_by_id_users_id_fk" FOREIGN KEY ("marked_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_requests" ADD CONSTRAINT "attendance_requests_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_requests" ADD CONSTRAINT "attendance_requests_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_requests" ADD CONSTRAINT "attendance_requests_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_memberships" ADD CONSTRAINT "location_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_memberships" ADD CONSTRAINT "location_memberships_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_records_worker_date_uq" ON "attendance_records" USING btree ("worker_id","date");--> statement-breakpoint
CREATE INDEX "attendance_records_location_date_idx" ON "attendance_records" USING btree ("location_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_requests_open_per_worker_date_uq" ON "attendance_requests" USING btree ("worker_id","date") WHERE "attendance_requests"."status" in ('PENDING', 'APPROVED');--> statement-breakpoint
CREATE INDEX "attendance_requests_location_date_idx" ON "attendance_requests" USING btree ("location_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "location_memberships_user_location_uq" ON "location_memberships" USING btree ("user_id","location_id");