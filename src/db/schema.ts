// Data model — see SPEC.md §4. Money is integer cents, always ex-GST.
// Everything lives in one SQLite database on the phone (see db/index.ts): one business, one person, no server.
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const ref = (name: string) => text(name);
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());
const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());
const bool = (name: string) => integer(name, { mode: "boolean" });
const pct = (name: string) => real(name);
const json = <T>(name: string) => text(name, { mode: "json" }).$type<T>();

// ── Value sets ───────────────────────────────────────────────────────────────
export const FINISH_LEVELS = ["basic", "standard", "premium"] as const;
export const USER_ROLES = ["owner", "admin", "member"] as const;
export const RATE_TYPES = ["labour", "material"] as const;
export const LINE_TYPES = ["material", "labour", "subbie", "other"] as const;
export const LINE_SOURCES = ["ai", "rate_rule", "kit", "supplier", "manual", "price_book"] as const;
export const ESTIMATE_STATUSES = ["draft", "sent", "accepted", "declined", "invoiced", "archived"] as const;
export const GENERATION_MODES = ["auto", "quick", "thorough"] as const;
export const VERSION_AUTHORS = ["user", "ai"] as const;
export const ATTACHMENT_KINDS = ["image", "video", "pdf", "sheet", "audio"] as const;
export const PROPOSAL_EVENT_TYPES = [
  "viewed",
  "downloaded",
  "accepted",
  "declined",
  "changes_requested",
  "bounced",
  "replied",
  "unsubscribed",
] as const;
export const INVOICE_STATUSES = ["draft", "sent", "paid", "void"] as const;
export const AI_PROVIDERS = ["publik", "anthropic", "openai", "google", "openrouter", "ollama"] as const;
export const CLIENT_KINDS = ["individual", "company"] as const;
export const PROJECT_STATUSES = ["quoting", "active", "on_hold", "completed", "cancelled"] as const;
export const TRANSCRIPTION_MODES = ["off", "openai", "local"] as const;

export type UserRole = (typeof USER_ROLES)[number];

// ── The business ────────────────────────────────────────────────────────────
export const organisations = sqliteTable("organisations", {
  id: id(),
  name: text("name").notNull(),
  /** The person using the app: shown in Settings → Account. */
  ownerName: text("owner_name").notNull().default(""),
  abn: text("abn"),
  /** The logo as a data: URL, so it travels with the database and backups. */
  logoUrl: text("logo_url"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  gstRegistered: bool("gst_registered").notNull().default(true),
  gstRate: pct("gst_rate").notNull().default(10),
  trades: json<string[]>("trades")
    .notNull()
    .$defaultFn(() => []),
  finishLevel: text("finish_level", { enum: FINISH_LEVELS }).notNull().default("standard"),
  postcode: text("postcode"),
  defaultMarkupPct: pct("default_markup_pct").notNull().default(20),
  // Optional per-type overrides; null falls back to defaultMarkupPct.
  markupMaterialsPct: pct("markup_materials_pct"),
  markupLabourPct: pct("markup_labour_pct"),
  markupSubbiePct: pct("markup_subbie_pct"),
  markupOtherPct: pct("markup_other_pct"),
  termsMd: text("terms_md"),
  quoteValidDays: integer("quote_valid_days").notNull().default(30),
  nextEstimateNo: integer("next_estimate_no").notNull().default(1001),
  nextProjectNo: integer("next_project_no").notNull().default(1),
  nextInvoiceNo: integer("next_invoice_no").notNull().default(1),
  defaultDueDays: integer("default_due_days").notNull().default(14),
  createdAt: createdAt(),
});

// ── AI settings ─────────────────────────────────────────────────────────────
export const rateRules = sqliteTable(
  "rate_rules",
  {
    id: id(),
    orgId: ref("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    rateCents: integer("rate_cents").notNull(),
    unit: text("unit").notNull(),
    type: text("type", { enum: RATE_TYPES }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("rate_rules_org_id_idx").on(t.orgId)],
);

export const aiInstructions = sqliteTable(
  "ai_instructions",
  {
    id: id(),
    orgId: ref("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("ai_instructions_org_id_idx").on(t.orgId)],
);

// Which AI the app uses (SPEC.md §7a). One row per business. A typed-in key is never stored here: it lives in the
// iPhone Keychain (lib/ai/keys.ts); this row only keeps its last four characters for display.
export const aiSettings = sqliteTable("ai_settings", {
  orgId: ref("org_id")
    .primaryKey()
    .references(() => organisations.id, { onDelete: "cascade" }),
  provider: text("provider", { enum: AI_PROVIDERS }).notNull().default("publik"),
  apiKeyLast4: text("api_key_last4"),
  baseUrl: text("base_url"), // OpenRouter / Ollama endpoint
  smartModel: text("smart_model"), // null = provider default
  fastModel: text("fast_model"),
  transcription: text("transcription", { enum: TRANSCRIPTION_MODES }).notNull().default("off"),
  updatedAt: updatedAt(),
});

// One row per AI call, so the business can see what it's spending.
export const aiUsage = sqliteTable(
  "ai_usage",
  {
    id: id(),
    orgId: ref("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    estimateId: ref("estimate_id").references(() => estimates.id, { onDelete: "set null" }),
    operation: text("operation").notNull(), // e.g. "generate", "tidy_dictation"
    provider: text("provider", { enum: AI_PROVIDERS }).notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    costMicroUsd: integer("cost_micro_usd"), // null when the model's price is unknown
    createdAt: createdAt(),
  },
  (t) => [index("ai_usage_org_created_idx").on(t.orgId, t.createdAt), index("ai_usage_estimate_id_idx").on(t.estimateId)],
);

// ── Clients ─────────────────────────────────────────────────────────────────
export const clients = sqliteTable(
  "clients",
  {
    id: id(),
    orgId: ref("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: CLIENT_KINDS }).notNull().default("individual"),
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
);

export const clientContacts = sqliteTable(
  "client_contacts",
  {
    id: id(),
    clientId: ref("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    role: text("role"),
  },
  (t) => [index("client_contacts_client_id_idx").on(t.clientId)],
);

// A job site: groups the estimates and invoices for one piece of work for one client.
export const projects = sqliteTable(
  "projects",
  {
    id: id(),
    orgId: ref("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    number: integer("number").notNull(), // rendered as PRJ-0001
    name: text("name").notNull(),
    clientId: ref("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    siteAddress: text("site_address"),
    status: text("status", { enum: PROJECT_STATUSES }).notNull().default("quoting"),
    startDate: text("start_date"), // YYYY-MM-DD
    endDate: text("end_date"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("projects_org_number_idx").on(t.orgId, t.number), index("projects_client_id_idx").on(t.clientId)],
);

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

export const estimates = sqliteTable(
  "estimates",
  {
    id: id(),
    orgId: ref("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    clientId: ref("client_id").references(() => clients.id, { onDelete: "set null" }),
    projectId: ref("project_id").references(() => projects.id, { onDelete: "set null" }),
    number: integer("number").notNull(), // rendered as EST-1001
    title: text("title").notNull().default("Untitled estimate"),
    siteAddress: text("site_address"),
    status: text("status", { enum: ESTIMATE_STATUSES }).notNull().default("draft"),
    description: text("description").notNull().default(""),
    generationMode: text("generation_mode", { enum: GENERATION_MODES }).notNull().default("auto"),
    markupPct: pct("markup_pct"), // null = use org defaults
    gstExempt: bool("gst_exempt").notNull().default(false),
    currentVersion: integer("current_version").notNull().default(1),
    displayOptions: json<DisplayOptions>("display_options"),
    // Filled by AI generation (SPEC.md §5); all editable afterwards.
    summary: text("summary"),
    scope: json<string[]>("scope"),
    assumptions: json<string[]>("assumptions"),
    exclusions: json<string[]>("exclusions"),
    alternatives: json<EstimateAlternative[]>("alternatives"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("estimates_org_number_idx").on(t.orgId, t.number),
    index("estimates_client_id_idx").on(t.clientId),
    index("estimates_project_id_idx").on(t.projectId),
  ],
);

// Immutable snapshot of groups + lines, written on every AI/user change and on send.
export const estimateVersions = sqliteTable(
  "estimate_versions",
  {
    id: id(),
    estimateId: ref("estimate_id")
      .notNull()
      .references(() => estimates.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    snapshot: json<unknown>("snapshot").notNull(),
    createdBy: text("created_by", { enum: VERSION_AUTHORS }).notNull(),
    reason: text("reason"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("estimate_versions_idx").on(t.estimateId, t.version)],
);

export const lineGroups = sqliteTable(
  "line_groups",
  {
    id: id(),
    estimateId: ref("estimate_id")
      .notNull()
      .references(() => estimates.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("line_groups_estimate_id_idx").on(t.estimateId)],
);

export const lineItems = sqliteTable(
  "line_items",
  {
    id: id(),
    groupId: ref("group_id")
      .notNull()
      .references(() => lineGroups.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    type: text("type", { enum: LINE_TYPES }).notNull(),
    qty: real("qty").notNull(),
    unit: text("unit").notNull(),
    unitCostCents: integer("unit_cost_cents").notNull(),
    markupPct: pct("markup_pct"), // null = estimate/org markup
    sort: integer("sort").notNull().default(0),
    notes: text("notes"),
    source: text("source", { enum: LINE_SOURCES }).notNull().default("manual"),
    sourceRef: text("source_ref"), // e.g. rate_rule id, or price book item id
  },
  (t) => [index("line_items_group_id_idx").on(t.groupId)],
);

// Polymorphic: owner_type is "estimate" | "client" | "org"
export const attachments = sqliteTable(
  "attachments",
  {
    id: id(),
    orgId: ref("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    ownerType: text("owner_type").notNull(),
    ownerId: text("owner_id").notNull(),
    kind: text("kind", { enum: ATTACHMENT_KINDS }).notNull(),
    url: text("url").notNull(),
    filename: text("filename").notNull(),
    extractedText: text("extracted_text"),
    createdAt: createdAt(),
  },
  (t) => [index("attachments_org_id_idx").on(t.orgId)],
);

// ── Sending quotes ──────────────────────────────────────────────────────────
// A quote goes out as a PDF from the phone's Share sheet. Each share is recorded here, and the tradie's own
// Accepted / Declined answer is a proposal event (there is no client page on the phone version).
export const proposalSends = sqliteTable(
  "proposal_sends",
  {
    id: id(),
    estimateId: ref("estimate_id")
      .notNull()
      .references(() => estimates.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    toEmail: text("to_email"),
    cc: json<string[]>("cc")
      .notNull()
      .$defaultFn(() => []),
    token: text("token").notNull().unique(),
    message: text("message"),
    followUpsEnabled: bool("follow_ups_enabled").notNull().default(false),
    sentAt: createdAt(),
  },
  (t) => [index("proposal_sends_estimate_id_idx").on(t.estimateId)],
);

export const proposalEvents = sqliteTable(
  "proposal_events",
  {
    id: id(),
    sendId: ref("send_id")
      .notNull()
      .references(() => proposalSends.id, { onDelete: "cascade" }),
    type: text("type", { enum: PROPOSAL_EVENT_TYPES }).notNull(),
    actorName: text("actor_name"),
    actorEmail: text("actor_email"),
    actorPosition: text("actor_position"),
    signatureSvg: text("signature_svg"),
    reason: text("reason"),
    // What the client answered: the estimate version and its total inc GST.
    estimateVersion: integer("estimate_version"),
    totalCents: integer("total_cents"),
    at: createdAt(),
  },
  (t) => [index("proposal_events_send_id_idx").on(t.sendId)],
);

// ── Invoices ────────────────────────────────────────────────────────────────
export const invoices = sqliteTable(
  "invoices",
  {
    id: id(),
    orgId: ref("org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    clientId: ref("client_id").references(() => clients.id, { onDelete: "set null" }),
    estimateId: ref("estimate_id").references(() => estimates.id, { onDelete: "set null" }),
    number: integer("number").notNull(), // rendered as INV-0001
    status: text("status", { enum: INVOICE_STATUSES }).notNull().default("draft"),
    dueDate: text("due_date"),
    lines: json<unknown>("lines").notNull(), // snapshot at time of invoicing
    totalCents: integer("total_cents").notNull(),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
    externalRef: text("external_ref"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("invoices_org_number_idx").on(t.orgId, t.number),
    index("invoices_client_id_idx").on(t.clientId),
    index("invoices_estimate_id_idx").on(t.estimateId),
  ],
);
