// MVP data model — see SPEC.md §4. Money is integer cents, always ex-GST.
// Every table has RLS enabled; the policies live in drizzle/0002_supabase_policies_storage.sql.
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const pct = (name: string) => numeric(name, { precision: 6, scale: 2, mode: "number" });

// ── Enums ────────────────────────────────────────────────────────────────────
export const finishLevel = pgEnum("finish_level", ["basic", "standard", "premium"]);
export const userRole = pgEnum("user_role", ["owner", "admin", "member"]);
export const rateType = pgEnum("rate_type", ["labour", "material"]);
export const lineType = pgEnum("line_type", ["material", "labour", "subbie", "other"]);
export const lineSource = pgEnum("line_source", ["ai", "rate_rule", "kit", "supplier", "manual"]);
export const estimateStatus = pgEnum("estimate_status", [
  "draft",
  "sent",
  "accepted",
  "declined",
  "invoiced",
  "archived",
]);
export const generationMode = pgEnum("generation_mode", ["auto", "quick", "thorough"]);
export const versionAuthor = pgEnum("version_author", ["user", "ai"]);
export const attachmentKind = pgEnum("attachment_kind", ["image", "video", "pdf", "sheet", "audio"]);
export const proposalEventType = pgEnum("proposal_event_type", [
  "viewed",
  "downloaded",
  "accepted",
  "declined",
  "changes_requested",
  "bounced",
  "replied",
  "unsubscribed",
]);
export const scheduledEmailKind = pgEnum("scheduled_email_kind", ["follow_up", "payment_reminder"]);
export const scheduledEmailStatus = pgEnum("scheduled_email_status", ["pending", "sent", "cancelled"]);
export const invoiceStatus = pgEnum("invoice_status", ["draft", "sent", "paid", "void"]);
export const aiProvider = pgEnum("ai_provider", ["anthropic", "openai", "google", "openrouter", "ollama"]);
export const clientKind = pgEnum("client_kind", ["individual", "company"]);
export const projectStatus = pgEnum("project_status", ["quoting", "active", "on_hold", "completed", "cancelled"]);
export const transcriptionMode = pgEnum("transcription_mode", ["off", "openai", "local"]);

// ── Organisation & users ────────────────────────────────────────────────────
export const organisations = pgTable("organisations", {
  id: id(),
  name: text("name").notNull(),
  abn: text("abn"),
  logoUrl: text("logo_url"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  gstRegistered: boolean("gst_registered").notNull().default(true),
  gstRate: pct("gst_rate").notNull().default(10),
  trades: text("trades").array().notNull().default([]),
  finishLevel: finishLevel("finish_level").notNull().default("standard"),
  postcode: text("postcode"),
  defaultMarkupPct: pct("default_markup_pct").notNull().default(20),
  // Optional per-type overrides; null falls back to defaultMarkupPct.
  markupMaterialsPct: pct("markup_materials_pct"),
  markupLabourPct: pct("markup_labour_pct"),
  markupSubbiePct: pct("markup_subbie_pct"),
  markupOtherPct: pct("markup_other_pct"),
  termsMd: text("terms_md"),
  nextEstimateNo: integer("next_estimate_no").notNull().default(1001),
  nextProjectNo: integer("next_project_no").notNull().default(1),
  nextInvoiceNo: integer("next_invoice_no").notNull().default(1),
  defaultDueDays: integer("default_due_days").notNull().default(14),
  createdAt: createdAt(),
}).enableRLS();

// One row per Supabase Auth user; id is the auth.users id.
export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    orgId: uuid("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    role: userRole("role").notNull().default("owner"),
    createdAt: createdAt(),
  },
  (t) => [index("users_org_id_idx").on(t.orgId)],
).enableRLS();

// ── AI settings ─────────────────────────────────────────────────────────────
export const rateRules = pgTable(
  "rate_rules",
  {
    id: id(),
    orgId: uuid("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    rateCents: integer("rate_cents").notNull(),
    unit: text("unit").notNull(),
    type: rateType("type").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("rate_rules_org_id_idx").on(t.orgId)],
).enableRLS();

export const aiInstructions = pgTable(
  "ai_instructions",
  {
    id: id(),
    orgId: uuid("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("ai_instructions_org_id_idx").on(t.orgId)],
).enableRLS();

// Bring-your-own-key AI config (SPEC.md §7a). One row per org; when absent the instance env key is used.
// Server-only: RLS on with no policies, and the key is AES-256-GCM encrypted with ENCRYPTION_KEY.
export const aiSettings = pgTable("ai_settings", {
  orgId: uuid("org_id")
    .primaryKey()
    .references(() => organisations.id, { onDelete: "cascade" }),
  provider: aiProvider("provider").notNull().default("anthropic"),
  apiKeyCiphertext: text("api_key_ciphertext"), // base64(iv | tag | ciphertext); null = use instance key
  apiKeyLast4: text("api_key_last4"),
  baseUrl: text("base_url"), // OpenRouter / Ollama endpoint
  smartModel: text("smart_model"), // null = provider default
  fastModel: text("fast_model"),
  transcription: transcriptionMode("transcription").notNull().default("off"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

// One row per LLM call, so each business can see what its own key is spending.
export const aiUsage = pgTable(
  "ai_usage",
  {
    id: id(),
    orgId: uuid("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
    estimateId: uuid("estimate_id").references(() => estimates.id, { onDelete: "set null" }),
    operation: text("operation").notNull(), // e.g. "generate", "refine", "classify"
    provider: aiProvider("provider").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    costMicroUsd: integer("cost_micro_usd"), // null when the model's price is unknown
    createdAt: createdAt(),
  },
  (t) => [
    index("ai_usage_org_created_idx").on(t.orgId, t.createdAt),
    index("ai_usage_estimate_id_idx").on(t.estimateId),
  ],
).enableRLS();

// ── Clients ─────────────────────────────────────────────────────────────────
export const clients = pgTable(
  "clients",
  {
    id: id(),
    orgId: uuid("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
    kind: clientKind("kind").notNull().default("individual"),
    name: text("name").notNull(), // person's name, or business name for a company
    contactName: text("contact_name"), // company's main contact
    abn: text("abn"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [index("clients_org_id_idx").on(t.orgId)],
).enableRLS();

export const clientContacts = pgTable(
  "client_contacts",
  {
    id: id(),
    clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    role: text("role"),
  },
  (t) => [index("client_contacts_client_id_idx").on(t.clientId)],
).enableRLS();

// A job site: groups the estimates, invoices and (later) job for one piece of work for one client.
export const projects = pgTable(
  "projects",
  {
    id: id(),
    orgId: uuid("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
    number: integer("number").notNull(), // rendered as PRJ-0001
    name: text("name").notNull(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    siteAddress: text("site_address"),
    status: projectStatus("status").notNull().default("quoting"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("projects_org_number_idx").on(t.orgId, t.number), index("projects_client_id_idx").on(t.clientId)],
).enableRLS();

// ── Estimates ───────────────────────────────────────────────────────────────
export type DisplayOptions = {
  detail: "total" | "groups" | "full";
  showScope: boolean;
  showQuantities: boolean;
  showRates: boolean;
  showItemPrices: boolean;
  showGroupTotals: boolean;
  pricesIncGst: boolean;
};

/** An upgrade or cost-saving option the client can be offered alongside the main estimate. */
export type EstimateAlternative = { kind: "upgrade" | "saving"; title: string; detail: string };

export const estimates = pgTable(
  "estimates",
  {
    id: id(),
    orgId: uuid("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    number: integer("number").notNull(), // rendered as EST-1001
    title: text("title").notNull().default("Untitled estimate"),
    siteAddress: text("site_address"),
    status: estimateStatus("status").notNull().default("draft"),
    description: text("description").notNull().default(""),
    generationMode: generationMode("generation_mode").notNull().default("auto"),
    markupPct: pct("markup_pct"), // null = use org defaults
    gstExempt: boolean("gst_exempt").notNull().default(false),
    currentVersion: integer("current_version").notNull().default(1),
    displayOptions: jsonb("display_options").$type<DisplayOptions>(),
    // Filled by AI generation (SPEC.md §5); all editable afterwards.
    summary: text("summary"),
    scope: jsonb("scope").$type<string[]>(),
    assumptions: jsonb("assumptions").$type<string[]>(),
    exclusions: jsonb("exclusions").$type<string[]>(),
    alternatives: jsonb("alternatives").$type<EstimateAlternative[]>(),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("estimates_org_number_idx").on(t.orgId, t.number),
    index("estimates_client_id_idx").on(t.clientId),
    index("estimates_project_id_idx").on(t.projectId),
  ],
).enableRLS();

// Immutable snapshot of groups + lines, written on every AI/user change and on send.
export const estimateVersions = pgTable(
  "estimate_versions",
  {
    id: id(),
    estimateId: uuid("estimate_id").notNull().references(() => estimates.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    createdBy: versionAuthor("created_by").notNull(),
    reason: text("reason"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("estimate_versions_idx").on(t.estimateId, t.version)],
).enableRLS();

export const lineGroups = pgTable(
  "line_groups",
  {
    id: id(),
    estimateId: uuid("estimate_id").notNull().references(() => estimates.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("line_groups_estimate_id_idx").on(t.estimateId)],
).enableRLS();

export const lineItems = pgTable(
  "line_items",
  {
    id: id(),
    groupId: uuid("group_id").notNull().references(() => lineGroups.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    type: lineType("type").notNull(),
    qty: numeric("qty", { precision: 12, scale: 3, mode: "number" }).notNull(),
    unit: text("unit").notNull(),
    unitCostCents: integer("unit_cost_cents").notNull(),
    markupPct: pct("markup_pct"), // null = estimate/org markup
    sort: integer("sort").notNull().default(0),
    notes: text("notes"),
    source: lineSource("source").notNull().default("manual"),
    sourceRef: text("source_ref"), // e.g. rate_rule id
  },
  (t) => [index("line_items_group_id_idx").on(t.groupId)],
).enableRLS();

// Polymorphic: owner_type is "estimate" | "client" | "org"
export const attachments = pgTable(
  "attachments",
  {
    id: id(),
    orgId: uuid("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
    ownerType: text("owner_type").notNull(),
    ownerId: uuid("owner_id").notNull(),
    kind: attachmentKind("kind").notNull(),
    url: text("url").notNull(),
    filename: text("filename").notNull(),
    extractedText: text("extracted_text"),
    createdAt: createdAt(),
  },
  (t) => [index("attachments_org_id_idx").on(t.orgId)],
).enableRLS();

// ── Proposals ───────────────────────────────────────────────────────────────
export const proposalSends = pgTable(
  "proposal_sends",
  {
    id: id(),
    estimateId: uuid("estimate_id").notNull().references(() => estimates.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    toEmail: text("to_email").notNull(),
    cc: text("cc").array().notNull().default([]),
    token: text("token").notNull().unique(), // public link /p/:token
    message: text("message"),
    followUpsEnabled: boolean("follow_ups_enabled").notNull().default(false),
    sentAt: createdAt(),
  },
  (t) => [index("proposal_sends_estimate_id_idx").on(t.estimateId)],
).enableRLS();

export const proposalEvents = pgTable(
  "proposal_events",
  {
    id: id(),
    sendId: uuid("send_id").notNull().references(() => proposalSends.id, { onDelete: "cascade" }),
    type: proposalEventType("type").notNull(),
    actorName: text("actor_name"),
    actorEmail: text("actor_email"),
    actorPosition: text("actor_position"),
    signatureSvg: text("signature_svg"),
    reason: text("reason"),
    at: createdAt(),
  },
  (t) => [index("proposal_events_send_id_idx").on(t.sendId)],
).enableRLS();

export const scheduledEmails = pgTable("scheduled_emails", {
  id: id(),
  kind: scheduledEmailKind("kind").notNull(),
  refId: uuid("ref_id").notNull(), // proposal_send id or invoice id
  sendAt: timestamp("send_at", { withTimezone: true }).notNull(),
  status: scheduledEmailStatus("status").notNull().default("pending"),
}).enableRLS();

// ── Invoices ────────────────────────────────────────────────────────────────
export const invoices = pgTable(
  "invoices",
  {
    id: id(),
    orgId: uuid("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    estimateId: uuid("estimate_id").references(() => estimates.id, { onDelete: "set null" }),
    number: integer("number").notNull(), // rendered as INV-0001
    status: invoiceStatus("status").notNull().default("draft"),
    dueDate: date("due_date"),
    lines: jsonb("lines").notNull(), // snapshot at time of invoicing
    totalCents: integer("total_cents").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    externalRef: text("external_ref"), // e.g. Xero invoice id
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("invoices_org_number_idx").on(t.orgId, t.number),
    index("invoices_client_id_idx").on(t.clientId),
    index("invoices_estimate_id_idx").on(t.estimateId),
  ],
).enableRLS();
