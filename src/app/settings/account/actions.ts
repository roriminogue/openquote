"use server";

import { passwordProblem } from "@/lib/password";
import { createClient } from "@/lib/supabase/server";

export type PasswordState = { status: "idle" | "error" | "saved"; message?: string; field?: string };

/** Sets (or changes) the signed-in person's password, so they can sign in without an emailed link. */
export async function setPassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const problem = passwordProblem(password);
  if (problem) return { status: "error", field: "password", message: problem };
  if (password !== confirm) return { status: "error", field: "confirm", message: "The two passwords don’t match." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { status: "error", message: "You’ve been signed out. Sign in again, then set your password." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    const message =
      error.code === "same_password"
        ? "That’s already your password."
        : error.code === "weak_password"
          ? "Choose a stronger password: longer, with a mix of letters and numbers."
          : error.message;
    return { status: "error", field: "password", message };
  }
  return { status: "saved", message: "Password saved. You can now sign in with your email and this password, on any device." };
}
