CREATE TYPE "public"."client_kind" AS ENUM('individual', 'company');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('quoting', 'active', 'on_hold', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"name" text NOT NULL,
	"client_id" uuid NOT NULL,
	"site_address" text,
	"status" "project_status" DEFAULT 'quoting' NOT NULL,
	"start_date" date,
	"end_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "kind" "client_kind" DEFAULT 'individual' NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "contact_name" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "abn" text;--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "next_project_no" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "projects_org_number_idx" ON "projects" USING btree ("org_id","number");--> statement-breakpoint
CREATE INDEX "projects_client_id_idx" ON "projects" USING btree ("client_id");--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "estimates_project_id_idx" ON "estimates" USING btree ("project_id");--> statement-breakpoint
CREATE POLICY "org members manage" ON public.projects FOR ALL TO authenticated
  USING (org_id = (SELECT private.current_org_id())) WITH CHECK (org_id = (SELECT private.current_org_id()));
