ALTER TABLE "proposal_sends" ALTER COLUMN "to_email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "quote_valid_days" integer DEFAULT 30 NOT NULL;