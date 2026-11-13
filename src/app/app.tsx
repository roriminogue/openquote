import { App as CapacitorApp } from "@capacitor/app";
import { useEffect, useState } from "react";
import { RouterProvider } from "react-router";
import { PointerFocus } from "@/components/pointer-focus";
import { PublikGate } from "@/components/publik-gate";
import { Wordmark } from "@/components/wordmark";
import { flush, openDatabase } from "@/db";
import { isNative } from "@/db/storage";
import { DataProvider } from "@/lib/data";
import { setUpKeyboard } from "@/lib/keyboard";
import { router } from "@/routes";
import { Providers } from "./providers";

/**
 * Opens the database, then shows the app. Everything after this runs on the phone: no server, no network unless
 * the person asks the AI for a quote.
 */
export function App() {
  const [state, setState] = useState<"opening" | "open" | Error>("opening");

  useEffect(() => {
    openDatabase().then(
      () => setState("open"),
      (e: Error) => setState(e),
    );
    // Save straight away when the app goes to the background: iOS may close it without warning after that.
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    const pause = isNative() ? CapacitorApp.addListener("pause", () => void flush()) : null;
    const stopKeyboard = setUpKeyboard();
    return () => {
      stopKeyboard();
      document.removeEventListener("visibilitychange", onHide);
      void pause?.then((l) => l.remove());
    };
  }, []);

  return (
    <Providers>
      <PointerFocus />
      {state === "open" ? (
        <PublikGate>
          <DataProvider>
            <RouterProvider router={router} />
          </DataProvider>
        </PublikGate>
      ) : (
        <div className="grid min-h-dvh flex-1 place-items-center px-6 text-center" aria-busy={state === "opening"}>
          {state === "opening" ? (
            <Wordmark />
          ) : (
            <div className="flex max-w-sm flex-col items-center gap-3">
              <Wordmark />
              <p>OpenQuote AU couldn&rsquo;t open its data: {state.message}</p>
            </div>
          )}
        </div>
      )}
    </Providers>
  );
}
