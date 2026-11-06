"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { loginErrorFor } from "@/lib/auth-messages";
import { createClient } from "@/lib/supabase/server";

async function callbackUrl() {
  const h = await headers();
  const origin = h.get("origin") ?? "http://localhost:3000";
  // From the iPhone app the emailed link opens Safari, so route it through a page that hands it back to the app.
  const inApp = h.get("user-agent")?.includes("OpenQuoteApp") ?? false;
  return `${origin}/auth/${inApp ? "open-app" : "callback"}`;
}

export async function sendMagicLink(formData: FormData) {
  const email = z.email().safeParse(formData.get("email"));
  if (!email.success) redirect("/login?error=invalid_email");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: await callbackUrl() },
  });
  if (error) redirect(`/login?error=${loginErrorFor(error)}`);
  redirect(`/login?sent=${encodeURIComponent(email.data)}`);
}

/** Signs in with the 6-digit code from the email, so the iPhone app never has to open the link in Safari. */
export async function verifyCode(formData: FormData) {
  const email = z.email().safeParse(formData.get("email"));
  const token = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!email.success) redirect("/login?error=invalid_email");
  const sent = `/login?sent=${encodeURIComponent(email.data)}`;
  if (!/^\d{6,10}$/.test(token)) redirect(`${sent}&codeError=format`);

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: email.data, token, type: "email" });
  if (error) redirect(`${sent}&codeError=${loginErrorFor(error) === "rate_limited" ? "rate_limited" : "wrong"}`);
  redirect("/onboarding");
}

export async function signInWithPassword(formData: FormData) {
  const email = z.email().safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  if (!email.success || !password) redirect("/login?error=missing_password");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.data, password });
  if (error) {
    redirect(`/login?error=${loginErrorFor(error)}&email=${encodeURIComponent(email.data)}`);
  }
  redirect("/onboarding");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await callbackUrl() },
  });
  if (error) redirect(`/login?error=${loginErrorFor(error)}`);
  redirect(data.url);
}
