import { z } from "zod";
import { db, schema } from "@/db";
import { getMember } from "@/lib/auth";
import { loadDemo } from "@/lib/demo";
import { navigateTo } from "@/lib/navigation";

const Onboarding = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  business: z.string().trim().min(1, "Enter your business name."),
});

export type OnboardingState = { error: string | null };

/** Fills the app with the sample business (lib/demo.ts), then opens Estimates. */
export async function startDemo() {
  if (!(await getMember())) await loadDemo();
  navigateTo("/estimates", { replace: true });
}

/** Creates the business on this phone, then opens Estimates. */
export async function createOrganisation(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const input = Onboarding.safeParse(Object.fromEntries(formData));
  if (!input.success) return { error: input.error.issues[0].message };
  if (!(await getMember())) {
    await db.insert(schema.organisations).values({ name: input.data.business, ownerName: input.data.name });
  }
  navigateTo("/estimates", { replace: true });
  return { error: null };
}
