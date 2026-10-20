CREATE TYPE "public"."ai_provider" AS ENUM('anthropic', 'openai', 'google', 'openrouter', 'ollama');--> statement-breakpoint
CREATE TYPE "public"."transcription_mode" AS ENUM('off', 'openai', 'local');--> statement-breakpoint
CREATE TABLE "ai_settings" (
	"org_id" uuid PRIMARY KEY NOT NULL,
	"provider" "ai_provider" DEFAULT 'anthropic' NOT NULL,
	"api_key_ciphertext" text,
	"api_key_last4" text,
	"base_url" text,
	"smart_model" text,
	"fast_model" text,
	"transcription" "transcription_mode" DEFAULT 'off' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"estimate_id" uuid,
	"operation" text NOT NULL,
	"provider" "ai_provider" NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_micro_usd" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_usage" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_org_id_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_usage_org_created_idx" ON "ai_usage" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_estimate_id_idx" ON "ai_usage" USING btree ("estimate_id");--> statement-breakpoint
-- ai_settings has no policies (server-only: it holds the encrypted key). Members may read their org's usage.
CREATE POLICY "org members read usage" ON public.ai_usage FOR SELECT TO authenticated
  USING (org_id = (SELECT private.current_org_id()));
