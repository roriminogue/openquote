"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { loginErrorFor } from "@/lib/auth-messages";
import { createClient } from "@/lib/supabase/server";

// Sign-in is one way only, on every device: enter your email, get a 6-digit code, type it in. No links (they only
// work in the browser that asked for them), no passwords, no Google.

/** Emails a one-time code. A new email gets an account too; whether it can create a business is decided later. */
export async function sendCode(formData: FormData) {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim());
  if (!email.success) redirect("/login?error=invalid_email");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email: email.data, options: { shouldCreateUser: true } });
  const sent = `/login?sent=${encodeURIComponent(email.data)}`;
  if (error) {
    const code = loginErrorFor(error);
    // Supabase allows one code a minute per email. Hitting that almost always means a code was just sent (a
    // second tap while the first was sending), so go to the code box rather than leaving them stuck here.
    if (code === "rate_limited") redirect(`${sent}&notice=recent`);
    redirect(`/login?error=${code}&email=${encodeURIComponent(email.data)}`);
  }
  redirect(sent);
}

/** Signs in with the code from the email. */
export async function verifyCode(formData: FormData) {
  const email = z.email().safeParse(formData.get("email"));
  const token = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!email.success) redirect("/login?error=invalid_email");
  const sent = `/login?sent=${encodeURIComponent(email.data)}`;
  if (!/^\d{6,10}$/.test(token)) redirect(`${sent}&codeError=format`);

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: email.data, token, type: "email" });
  if (error) {
    const code = loginErrorFor(error);
    redirect(`${sent}&codeError=${code === "rate_limited" ? "rate_limited" : code === "link_expired" ? "expired" : "wrong"}`);
  }
  redirect("/onboarding");
}
