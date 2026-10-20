ALTER TABLE "ai_instructions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "attachments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "client_contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "estimate_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "estimates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "line_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "line_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "organisations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "proposal_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "proposal_sends" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rate_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "scheduled_emails" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_instructions_org_id_idx" ON "ai_instructions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "attachments_org_id_idx" ON "attachments" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "client_contacts_client_id_idx" ON "client_contacts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "clients_org_id_idx" ON "clients" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "estimates_client_id_idx" ON "estimates" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "invoices_client_id_idx" ON "invoices" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "invoices_estimate_id_idx" ON "invoices" USING btree ("estimate_id");--> statement-breakpoint
CREATE INDEX "line_groups_estimate_id_idx" ON "line_groups" USING btree ("estimate_id");--> statement-breakpoint
CREATE INDEX "line_items_group_id_idx" ON "line_items" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "proposal_events_send_id_idx" ON "proposal_events" USING btree ("send_id");--> statement-breakpoint
CREATE INDEX "proposal_sends_estimate_id_idx" ON "proposal_sends" USING btree ("estimate_id");--> statement-breakpoint
CREATE INDEX "rate_rules_org_id_idx" ON "rate_rules" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "users_org_id_idx" ON "users" USING btree ("org_id");