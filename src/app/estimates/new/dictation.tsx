import { Icon } from "@astryxdesign/core/Icon";
import { ToggleButton } from "@astryxdesign/core/ToggleButton";
import { Mic } from "lucide-react";
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
    // A quiet toggle in the composer's footer, not a button shouting for attention. While listening it stays
    // pressed, four orange bars move (the live state) and the label becomes Stop with a running time.
    button: kind ? (
      <ToggleButton
        label={status === "listening" ? `Stop talking (${elapsedFmt(elapsed)})` : "Talk instead of typing"}
        isPressed={status === "listening"}
        onPressedChange={() => toggle()}
        isDisabled={status === "starting" || status === "tidying"}
        icon={<Icon icon={Mic} />}
        pressedIcon={
          <span aria-hidden className="voice-bars">
            <span />
            <span />
            <span />
            <span />
          </span>
        }
      >
        {status === "listening" ? (
          <>
            Stop <span className="font-normal tabular-nums text-(--color-text-secondary)">{elapsedFmt(elapsed)}</span>
          </>
        ) : status === "starting" ? (
          "Starting…"
        ) : status === "tidying" ? (
          "Checking words…"
        ) : (
          "Talk"
        )}
      </ToggleButton>
    ) : null,
    statusLine:
      status === "listening" ? (
        <p className="sr-only">Listening. Talk it through, then press Stop.</p>
      ) : problem ? (
        <p className="text-(length:--text-supporting-size) text-(--color-text-error)">{problem}</p>
      ) : tidied && value === tidied.result ? (
        <p className="text-(length:--text-supporting-size) text-(--color-text-secondary)">
          {tidied.fixed.length ? `Fixed: ${tidied.fixed.join(", ")}. ` : "Tidied up the wording. "}
          <button type="button" onClick={undoTidy} className="font-medium text-(--color-text-primary) underline underline-offset-2">
            Undo
          </button>
        </p>
      ) : null,
  };
}
