CREATE TYPE "public"."attachment_kind" AS ENUM('image', 'video', 'pdf', 'sheet', 'audio');--> statement-breakpoint
CREATE TYPE "public"."estimate_status" AS ENUM('draft', 'sent', 'accepted', 'declined', 'invoiced', 'archived');--> statement-breakpoint
CREATE TYPE "public"."finish_level" AS ENUM('basic', 'standard', 'premium');--> statement-breakpoint
CREATE TYPE "public"."generation_mode" AS ENUM('auto', 'quick', 'thorough');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'void');--> statement-breakpoint
CREATE TYPE "public"."line_source" AS ENUM('ai', 'rate_rule', 'kit', 'supplier', 'manual');--> statement-breakpoint
CREATE TYPE "public"."line_type" AS ENUM('material', 'labour', 'subbie', 'other');--> statement-breakpoint
CREATE TYPE "public"."proposal_event_type" AS ENUM('viewed', 'downloaded', 'accepted', 'declined', 'changes_requested', 'bounced', 'replied', 'unsubscribed');--> statement-breakpoint
CREATE TYPE "public"."rate_type" AS ENUM('labour', 'material');--> statement-breakpoint
CREATE TYPE "public"."scheduled_email_kind" AS ENUM('follow_up', 'payment_reminder');--> statement-breakpoint
CREATE TYPE "public"."scheduled_email_status" AS ENUM('pending', 'sent', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."version_author" AS ENUM('user', 'ai');--> statement-breakpoint
CREATE TABLE "ai_instructions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"owner_type" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"kind" "attachment_kind" NOT NULL,
	"url" text NOT NULL,
	"filename" text NOT NULL,
	"extracted_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"role" text
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimate_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estimate_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_by" "version_author" NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"client_id" uuid,
	"number" integer NOT NULL,
	"title" text DEFAULT 'Untitled estimate' NOT NULL,
	"site_address" text,
	"status" "estimate_status" DEFAULT 'draft' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"generation_mode" "generation_mode" DEFAULT 'auto' NOT NULL,
	"markup_pct" numeric(6, 2),
	"gst_exempt" boolean DEFAULT false NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"display_options" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"client_id" uuid,
	"estimate_id" uuid,
	"number" integer NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"due_date" date,
	"lines" jsonb NOT NULL,
	"total_cents" integer NOT NULL,
	"paid_at" timestamp with time zone,
	"external_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "line_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estimate_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"description" text NOT NULL,
	"type" "line_type" NOT NULL,
	"qty" numeric(12, 3) NOT NULL,
	"unit" text NOT NULL,
	"unit_cost_cents" integer NOT NULL,
	"markup_pct" numeric(6, 2),
	"sort" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"source" "line_source" DEFAULT 'manual' NOT NULL,
	"source_ref" text
);
--> statement-breakpoint
CREATE TABLE "organisations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"abn" text,
	"logo_url" text,
	"email" text,
	"phone" text,
	"address" text,
	"gst_registered" boolean DEFAULT true NOT NULL,
	"gst_rate" numeric(6, 2) DEFAULT 10 NOT NULL,
	"trades" text[] DEFAULT '{}' NOT NULL,
	"finish_level" "finish_level" DEFAULT 'standard' NOT NULL,
	"postcode" text,
	"default_markup_pct" numeric(6, 2) DEFAULT 20 NOT NULL,
	"markup_materials_pct" numeric(6, 2),
	"markup_labour_pct" numeric(6, 2),
	"markup_subbie_pct" numeric(6, 2),
	"markup_other_pct" numeric(6, 2),
	"terms_md" text,
	"next_estimate_no" integer DEFAULT 1001 NOT NULL,
	"next_invoice_no" integer DEFAULT 1 NOT NULL,
	"default_due_days" integer DEFAULT 14 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"send_id" uuid NOT NULL,
	"type" "proposal_event_type" NOT NULL,
	"actor_name" text,
	"actor_email" text,
	"actor_position" text,
	"signature_svg" text,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estimate_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"to_email" text NOT NULL,
	"cc" text[] DEFAULT '{}' NOT NULL,
	"token" text NOT NULL,
	"message" text,
	"follow_ups_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_sends_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "rate_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" text NOT NULL,
	"rate_cents" integer NOT NULL,
	"unit" text NOT NULL,
	"type" "rate_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "scheduled_email_kind" NOT NULL,
	"ref_id" uuid NOT NULL,
	"send_at" timestamp with time zone NOT NULL,
	"status" "scheduled_email_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'owner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_instructions" ADD CONSTRAINT "ai_instructions_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_versions" ADD CONSTRAINT "estimate_versions_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_groups" ADD CONSTRAINT "line_groups_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_group_id_line_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."line_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_events" ADD CONSTRAINT "proposal_events_send_id_proposal_sends_id_fk" FOREIGN KEY ("send_id") REFERENCES "public"."proposal_sends"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_sends" ADD CONSTRAINT "proposal_sends_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_rules" ADD CONSTRAINT "rate_rules_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "estimate_versions_idx" ON "estimate_versions" USING btree ("estimate_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "estimates_org_number_idx" ON "estimates" USING btree ("org_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_org_number_idx" ON "invoices" USING btree ("org_id","number");