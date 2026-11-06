"use client";

import { useActionState } from "react";
import { Button, GroupTitle, Input, Notice, Panel, Row, Rows } from "@/components/ui";
import { setPassword, type PasswordState } from "./actions";

export function PasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(setPassword, { status: "idle" });
  return (
    <section aria-labelledby="password" className="mt-10">
      <GroupTitle id="password">Password</GroupTitle>
      <form action={action}>
        {/* Lets password managers file the new password under the right account. */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        <Panel>
          <Rows>
            <Row label="New password" htmlFor="password" hint="At least 12 characters (a few words together works well). Sign in with it instead of an emailed link.">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                aria-invalid={state.field === "password" || undefined}
              />
            </Row>
            <Row label="Confirm password" htmlFor="confirm">
              <Input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                aria-invalid={state.field === "confirm" || undefined}
              />
            </Row>
          </Rows>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-dashed border-border px-4 py-4 sm:px-5">
            {state.message && (
              <div className="mr-auto min-w-0" aria-live="polite">
                <Notice tone={state.status === "error" ? "error" : "ok"}>{state.message}</Notice>
              </div>
            )}
            <Button className="max-sm:w-full" disabled={pending}>
              {pending ? "Saving…" : "Save password"}
            </Button>
          </div>
        </Panel>
      </form>
    </section>
  );
}
