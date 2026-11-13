import { z } from "zod";
import { phoneField } from "./business-schema";

// Validation and shapes for projects and clients. Pure: safe to import from client components and tests.

export const formatProjectNo = (n: number) => `PRJ-${String(n).padStart(4, "0")}`;

const optionalText = z
  .string()
  .trim()
  .max(500)
  .transform((v) => v || null);
const optionalDate = z
  .string()
  .trim()
  .transform((v) => v || null)
  .pipe(z.iso.date().nullable());

export const ClientInput = z
  .object({
    kind: z.enum(["individual", "company"]),
    name: z.string().trim().min(1, "Add a name.").max(200),
    contactName: optionalText,
    email: z
      .string()
      .trim()
      .transform((v) => v || null)
      .pipe(z.email("That email doesn't look right.").nullable()),
    phone: phoneField(200),
    abn: optionalText,
    address: optionalText,
  })
  .transform((c) => ({ ...c, contactName: c.kind === "company" ? c.contactName : null }));

export const ProjectInput = z
  .object({
    name: z.string().trim().min(1, "Give the project a name.").max(200),
    clientId: z.uuid("Choose a client."),
    siteAddress: optionalText,
    status: z.enum(["quoting", "active", "on_hold", "completed", "cancelled"]),
    startDate: optionalDate,
    endDate: optionalDate,
    notes: z
      .string()
      .trim()
      .max(4000)
      .transform((v) => v || null),
  })
  .refine((p) => !p.startDate || !p.endDate || p.endDate >= p.startDate, {
    message: "The end date is before the start date.",
    path: ["endDate"],
  });

export type ClientOption = {
  id: string;
  kind: "individual" | "company";
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

export type ProjectOption = {
  id: string;
  number: number;
  name: string;
  siteAddress: string | null;
  status: string;
  client: { id: string; name: string; address: string | null };
  lastUsedAt: string;
};
