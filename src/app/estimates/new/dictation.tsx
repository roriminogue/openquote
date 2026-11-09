"use client";

import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { dictationKind, startDictation, type Dictation, type DictationKind } from "@/lib/voice/dictation";
import { joinSpoken } from "@/lib/voice/text";
import { tidyDictation } from "./actions";

type Status = "idle" | "starting" | "listening" | "tidying";
type Tidied = { base: string; heard: string; result: string; fixed: string[] };

// Which recogniser exists is only known in the browser (null while rendering on the server); it never changes.
const noSubscribe = () => () => {};
const serverKind = () => null;

const elapsedFmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * Talk instead of typing. The device's own recogniser writes the words into the box as you speak (no AI key
 * needed), after anything already typed. When you stop, the business's AI provider, if one is set up, fixes
 * misheard trade words, and the change can be undone.
 */
export function useDictation({
  value,
  onChange,
  hints,
  canTidy,
}: {
  value: string;
  onChange: (text: string) => void;
  hints: string[];
  canTidy: boolean;
}) {
  const kind = useSyncExternalStore<DictationKind | null>(noSubscribe, dictationKind, serverKind);
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);
  const [tidied, setTidied] = useState<Tidied | null>(null);
  const session = useRef<Dictation | null>(null);

  useEffect(() => {
    if (status !== "listening") return;
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 500);
    return () => clearInterval(timer);
  }, [status]);

  // Stop listening if the page goes away mid-sentence.
  useEffect(() => () => session.current?.stop(), []);

  async function finish(base: string, heard: string, why?: string) {
    session.current = null;
    if (why) setProblem(why);
    if (!heard.trim()) return setStatus("idle");
    onChange(joinSpoken(base, heard));
    if (!canTidy) return setStatus("idle");
    setStatus("tidying");
    const res = await tidyDictation(heard).catch(() => ({ ok: false }) as const);
    if (res.ok && res.text !== heard.trim()) {
      onChange(joinSpoken(base, res.text));
      setTidied({ base, heard, result: joinSpoken(base, res.text), fixed: res.fixed });
    }
    setStatus("idle");
  }

  async function toggle() {
    if (status === "listening") return session.current?.stop();
    if (status !== "idle" || !kind) return;
    const base = value;
    setProblem(null);
    setTidied(null);
    setElapsed(0);
    setStatus("starting");
    try {
      session.current = await startDictation(kind, hints, {
        onText: (heard) => onChange(joinSpoken(base, heard)),
        onEnd: (heard, why) => void finish(base, heard, why),
      });
      setStatus("listening");
    } catch (e) {
      session.current = null;
      setStatus("idle");
      setProblem(e instanceof Error && e.message ? e.message : "Couldn't start listening. Try again.");
    }
  }

  function undoTidy() {
    if (!tidied) return;
    onChange(joinSpoken(tidied.base, tidied.heard));
    setTidied(null);
  }

  return {
    supported: kind !== null,
    status,
    busy: status !== "idle",
    toggle,
    button: kind ? (
      <button
        type="button"
        onClick={toggle}
        disabled={status === "starting" || status === "tidying"}
        aria-pressed={status === "listening"}
        aria-label={status === "listening" ? "Stop talking" : "Talk instead of typing"}
        title={status === "listening" ? "Stop" : "Talk instead of typing"}
        className={`inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 text-[0.9375rem] font-medium transition-[background-color,border-color,color] duration-150 disabled:opacity-60 sm:h-8 sm:px-2.5 sm:text-xs ${
          status === "listening"
            ? "border-accent-hover bg-accent-soft text-accent-ink"
            : "border-border-strong bg-bg text-ink hover:bg-hover"
        }`}
      >
        {status === "listening" ? (
          <>
            <span aria-hidden className="size-2 rounded-full bg-accent motion-safe:animate-pulse" />
            <span className="figures">{elapsedFmt(elapsed)}</span>
            <Square className="size-3 fill-current" aria-hidden />
            <span>Stop</span>
          </>
        ) : (
          <>
            <Mic className="size-4 sm:size-3.5" aria-hidden />
            <span className={status === "idle" ? "max-sm:sr-only" : ""}>
              {status === "starting" ? "Starting…" : status === "tidying" ? "Checking words…" : "Talk"}
            </span>
          </>
        )}
      </button>
    ) : null,
    statusLine:
      status === "listening" ? (
        <p className="text-xs text-ink-3">Listening. Talk it through like you would on the phone, then tap Stop.</p>
      ) : problem ? (
        <p className="text-xs text-danger">{problem}</p>
      ) : tidied && value === tidied.result ? (
        <p className="text-xs text-ink-3">
          {tidied.fixed.length ? `Fixed: ${tidied.fixed.join(", ")}. ` : "Tidied up the wording. "}
          <button type="button" onClick={undoTidy} className="font-medium text-ink underline underline-offset-2">
            Undo
          </button>
        </p>
      ) : null,
  };
}
