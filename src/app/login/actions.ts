"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

async function callbackUrl() {
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  return `${origin}/auth/callback`;
}

export async function sendMagicLink(formData: FormData) {
  const email = z.email().safeParse(formData.get("email"));
  if (!email.success) redirect("/login?error=Enter+a+valid+email");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: await callbackUrl() },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect(`/login?sent=${encodeURIComponent(email.data)}`);
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await callbackUrl() },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect(data.url);
}
