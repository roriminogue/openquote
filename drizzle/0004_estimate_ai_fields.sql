ALTER TABLE "estimates" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "scope" jsonb;--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "assumptions" jsonb;--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "exclusions" jsonb;--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "alternatives" jsonb;