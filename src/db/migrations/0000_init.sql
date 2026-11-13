CREATE TABLE `ai_instructions` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`text` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organisations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ai_instructions_org_id_idx` ON `ai_instructions` (`org_id`);--> statement-breakpoint
CREATE TABLE `ai_settings` (
	`org_id` text PRIMARY KEY NOT NULL,
	`provider` text DEFAULT 'publik' NOT NULL,
	`api_key_last4` text,
	`base_url` text,
	`smart_model` text,
	`fast_model` text,
	`transcription` text DEFAULT 'off' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organisations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ai_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`estimate_id` text,
	`operation` text NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`cost_micro_usd` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organisations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`estimate_id`) REFERENCES `estimates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ai_usage_org_created_idx` ON `ai_usage` (`org_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ai_usage_estimate_id_idx` ON `ai_usage` (`estimate_id`);--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`owner_type` text NOT NULL,
	`owner_id` text NOT NULL,
	`kind` text NOT NULL,
	`url` text NOT NULL,
	`filename` text NOT NULL,
	`extracted_text` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organisations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attachments_org_id_idx` ON `attachments` (`org_id`);--> statement-breakpoint
CREATE TABLE `client_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`role` text,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `client_contacts_client_id_idx` ON `client_contacts` (`client_id`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`kind` text DEFAULT 'individual' NOT NULL,
	`name` text NOT NULL,
	`contact_name` text,
	`abn` text,
	`email` text,
	`phone` text,
	`address` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organisations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `clients_org_id_idx` ON `clients` (`org_id`);--> statement-breakpoint
CREATE TABLE `estimate_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`estimate_id` text NOT NULL,
	`version` integer NOT NULL,
	`snapshot` text NOT NULL,
	`created_by` text NOT NULL,
	`reason` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`estimate_id`) REFERENCES `estimates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `estimate_versions_idx` ON `estimate_versions` (`estimate_id`,`version`);--> statement-breakpoint
CREATE TABLE `estimates` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`client_id` text,
	`project_id` text,
	`number` integer NOT NULL,
	`title` text DEFAULT 'Untitled estimate' NOT NULL,
	`site_address` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`generation_mode` text DEFAULT 'auto' NOT NULL,
	`markup_pct` real,
	`gst_exempt` integer DEFAULT false NOT NULL,
	`current_version` integer DEFAULT 1 NOT NULL,
	`display_options` text,
	`summary` text,
	`scope` text,
	`assumptions` text,
	`exclusions` text,
	`alternatives` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organisations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `estimates_org_number_idx` ON `estimates` (`org_id`,`number`);--> statement-breakpoint
CREATE INDEX `estimates_client_id_idx` ON `estimates` (`client_id`);--> statement-breakpoint
CREATE INDEX `estimates_project_id_idx` ON `estimates` (`project_id`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`client_id` text,
	`estimate_id` text,
	`number` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`due_date` text,
	`lines` text NOT NULL,
	`total_cents` integer NOT NULL,
	`paid_at` integer,
	`external_ref` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organisations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`estimate_id`) REFERENCES `estimates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_org_number_idx` ON `invoices` (`org_id`,`number`);--> statement-breakpoint
CREATE INDEX `invoices_client_id_idx` ON `invoices` (`client_id`);--> statement-breakpoint
CREATE INDEX `invoices_estimate_id_idx` ON `invoices` (`estimate_id`);--> statement-breakpoint
CREATE TABLE `line_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`estimate_id` text NOT NULL,
	`name` text NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`estimate_id`) REFERENCES `estimates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `line_groups_estimate_id_idx` ON `line_groups` (`estimate_id`);--> statement-breakpoint
CREATE TABLE `line_items` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`description` text NOT NULL,
	`type` text NOT NULL,
	`qty` real NOT NULL,
	`unit` text NOT NULL,
	`unit_cost_cents` integer NOT NULL,
	`markup_pct` real,
	`sort` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`source` text DEFAULT 'manual' NOT NULL,
	`source_ref` text,
	FOREIGN KEY (`group_id`) REFERENCES `line_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `line_items_group_id_idx` ON `line_items` (`group_id`);--> statement-breakpoint
CREATE TABLE `organisations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner_name` text DEFAULT '' NOT NULL,
	`abn` text,
	`logo_url` text,
	`email` text,
	`phone` text,
	`address` text,
	`gst_registered` integer DEFAULT true NOT NULL,
	`gst_rate` real DEFAULT 10 NOT NULL,
	`trades` text NOT NULL,
	`finish_level` text DEFAULT 'standard' NOT NULL,
	`postcode` text,
	`default_markup_pct` real DEFAULT 20 NOT NULL,
	`markup_materials_pct` real,
	`markup_labour_pct` real,
	`markup_subbie_pct` real,
	`markup_other_pct` real,
	`terms_md` text,
	`quote_valid_days` integer DEFAULT 30 NOT NULL,
	`next_estimate_no` integer DEFAULT 1001 NOT NULL,
	`next_project_no` integer DEFAULT 1 NOT NULL,
	`next_invoice_no` integer DEFAULT 1 NOT NULL,
	`default_due_days` integer DEFAULT 14 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`number` integer NOT NULL,
	`name` text NOT NULL,
	`client_id` text NOT NULL,
	`site_address` text,
	`status` text DEFAULT 'quoting' NOT NULL,
	`start_date` text,
	`end_date` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organisations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_org_number_idx` ON `projects` (`org_id`,`number`);--> statement-breakpoint
CREATE INDEX `projects_client_id_idx` ON `projects` (`client_id`);--> statement-breakpoint
CREATE TABLE `proposal_events` (
	`id` text PRIMARY KEY NOT NULL,
	`send_id` text NOT NULL,
	`type` text NOT NULL,
	`actor_name` text,
	`actor_email` text,
	`actor_position` text,
	`signature_svg` text,
	`reason` text,
	`estimate_version` integer,
	`total_cents` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`send_id`) REFERENCES `proposal_sends`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `proposal_events_send_id_idx` ON `proposal_events` (`send_id`);--> statement-breakpoint
CREATE TABLE `proposal_sends` (
	`id` text PRIMARY KEY NOT NULL,
	`estimate_id` text NOT NULL,
	`version` integer NOT NULL,
	`to_email` text,
	`cc` text NOT NULL,
	`token` text NOT NULL,
	`message` text,
	`follow_ups_enabled` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`estimate_id`) REFERENCES `estimates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `proposal_sends_token_unique` ON `proposal_sends` (`token`);--> statement-breakpoint
CREATE INDEX `proposal_sends_estimate_id_idx` ON `proposal_sends` (`estimate_id`);--> statement-breakpoint
CREATE TABLE `rate_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`title` text NOT NULL,
	`rate_cents` integer NOT NULL,
	`unit` text NOT NULL,
	`type` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organisations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `rate_rules_org_id_idx` ON `rate_rules` (`org_id`);