import { Button } from "@astryxdesign/core/Button";
import { Text } from "@astryxdesign/core/Text";
import { useEffect, useState, type ReactNode } from "react";
import { publikConfigured, pressPublik, runPublikGate, type PublikScreen } from "@/lib/publik";
import { AuthFrame } from "./auth-frame";

/**
 * The app opens behind Sign in with publik once the build is set up for publik (see lib/publik.ts). The words and
 * buttons come from publik's module; this only draws them. Until the build has publik's app token, the app opens
 * straight away.
 */
export function PublikGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"checking" | "open" | PublikScreen>("checking");

  useEffect(() => {
    let live = true;
    void (async () => {
      if (!(await publikConfigured())) return live && setState("open");
      const result = await runPublikGate((screen) => live && setState(screen.id === "done" ? "open" : screen));
      if (live && result.signedIn) setState("open");
    })().catch(() => live && setState("open"));
    return () => {
      live = false;
    };
  }, []);

  if (state === "open") return children;
  if (state === "checking") return null;
  return (
    <AuthFrame title={state.title ?? "Sign in with publik"} intro={state.body}>
      <div className="flex flex-col gap-3">
        {state.note && (
          <Text as="p" type="supporting">
            {state.note}
          </Text>
        )}
        {state.buttons?.map((b, i) => (
          <Button
            key={b.action}
            label={b.label}
            variant={i === 0 ? "primary" : "secondary"}
            size="lg"
            width="100%"
            onClick={() => void pressPublik(b.action)}
          />
        ))}
      </div>
    </AuthFrame>
  );
}
