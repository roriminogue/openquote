// Live dictation in the browser and in the iPhone app, with no AI key: the device's own speech recogniser does the
// listening. Inside the iPhone app that's Apple's recogniser (through the speech plugin, with trade-word hints);
// in a browser it's the built-in Web Speech API (Chrome, Edge, Safari). Recognisers stop after a pause or about a
// minute, so this restarts them until the person taps Stop, and joins the pieces.

import { joinSpoken } from "./text";

export type DictationKind = "native" | "web";

export type DictationHandlers = {
  /** Everything heard so far, including words still being recognised. */
  onText: (spoken: string) => void;
  /** Listening has ended (Stop, or a problem); `spoken` is the final text. */
  onEnd: (spoken: string, problem?: string) => void;
};

export type Dictation = { stop: () => void };

const LANGUAGE = "en-AU";

type CapacitorGlobal = { isNativePlatform?: () => boolean; isPluginAvailable?: (name: string) => boolean };

// Minimal Web Speech API types: TypeScript's DOM library doesn't include them.
type WebSpeechResult = { isFinal: boolean; 0: { transcript: string } };
type WebSpeechEvent = { results: ArrayLike<WebSpeechResult> };
type WebSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: WebSpeechEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type WebSpeechConstructor = new () => WebSpeechRecognition;

function webSpeech(): WebSpeechConstructor | undefined {
  const w = window as unknown as { SpeechRecognition?: WebSpeechConstructor; webkitSpeechRecognition?: WebSpeechConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** Which recogniser this device can use, or null (e.g. Firefox): then the keyboard's own mic is the way to talk. */
export function dictationKind(): DictationKind | null {
  if (typeof window === "undefined") return null;
  const cap = (window as { Capacitor?: CapacitorGlobal }).Capacitor;
  if (cap?.isNativePlatform?.() && cap.isPluginAvailable?.("SpeechRecognition")) return "native";
  return webSpeech() ? "web" : null;
}

export function startDictation(kind: DictationKind, hints: string[], handlers: DictationHandlers): Promise<Dictation> {
  return kind === "native" ? startNative(hints, handlers) : Promise.resolve(startWeb(handlers));
}

const WEB_PROBLEMS: Record<string, string> = {
  "not-allowed": "Allow the microphone for this site in your browser settings, then try again.",
  "service-not-allowed": "Allow the microphone for this site in your browser settings, then try again.",
  "audio-capture": "No microphone was found. Plug one in or use your phone.",
  network: "Speech recognition needs an internet connection. Check your connection and try again.",
  "language-not-supported": "This browser can't recognise Australian English. Try Chrome or Safari.",
};

function startWeb({ onText, onEnd }: DictationHandlers): Dictation {
  const Recognition = webSpeech()!;
  let committed = "";
  let current = "";
  let active = true;
  let finished = false;
  let problem: string | undefined;
  let quickEnds = 0;
  let rec: WebSpeechRecognition;

  const finish = () => {
    if (finished) return;
    finished = true;
    onEnd(committed, problem);
  };

  const begin = () => {
    const startedAt = Date.now();
    rec = new Recognition();
    rec.lang = LANGUAGE;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final = joinSpoken(final, r[0].transcript);
        else interim = joinSpoken(interim, r[0].transcript);
      }
      current = joinSpoken(final, interim);
      onText(joinSpoken(committed, current));
    };
    rec.onerror = (e) => {
      // A pause with no speech, or our own stop: not a problem, the session just restarts or ends.
      if (e.error === "no-speech" || e.error === "aborted") return;
      problem = WEB_PROBLEMS[e.error] ?? "Speech recognition stopped. Tap the mic to carry on.";
      active = false;
    };
    rec.onend = () => {
      committed = joinSpoken(committed, current);
      current = "";
      // Restart after a pause, unless it keeps ending straight away (then something's wrong: stop trying).
      quickEnds = Date.now() - startedAt < 1000 ? quickEnds + 1 : 0;
      if (active && quickEnds < 3) {
        try {
          begin();
          return;
        } catch {
          // fall through to finish
        }
      }
      finish();
    };
    rec.start();
  };

  begin();
  return {
    stop() {
      active = false;
      rec.stop();
    },
  };
}

async function startNative(hints: string[], { onText, onEnd }: DictationHandlers): Promise<Dictation> {
  const { SpeechRecognition } = await import("@capgo/capacitor-speech-recognition");
  const permission = await SpeechRecognition.requestPermissions();
  if (permission.speechRecognition !== "granted") {
    throw new Error("Allow the microphone and speech recognition for OpenQuote in the iPhone's Settings → OpenQuote.");
  }

  let committed = "";
  let current = "";
  let active = true;
  let finished = false;
  let restartPending = false;
  let problem: string | undefined;

  const start = () =>
    SpeechRecognition.start({ language: LANGUAGE, partialResults: true, addPunctuation: true, contextualStrings: hints });

  const listeners = await Promise.all([
    SpeechRecognition.addListener("partialResults", (e) => {
      const text = e.matches?.[0];
      if (text === undefined) return;
      current = text;
      onText(joinSpoken(committed, current));
    }),
    SpeechRecognition.addListener("listeningState", (e) => {
      if (e.state !== "stopped" && e.status !== "stopped") return;
      committed = joinSpoken(committed, current);
      current = "";
      if (!active) return finish();
      // Apple's recogniser ends after a pause or about a minute: start again once it's ready.
      restartPending = true;
      setTimeout(restart, 600);
    }),
    SpeechRecognition.addListener("readyForNextSession", () => restart()),
    SpeechRecognition.addListener("error", (e) => {
      if (/denied|permission|not.?authori/i.test(`${e.code} ${e.message}`)) {
        problem = "Allow the microphone and speech recognition for OpenQuote in the iPhone's Settings → OpenQuote.";
        active = false;
      }
    }),
  ]);

  function restart() {
    if (!restartPending) return;
    restartPending = false;
    if (!active) return finish();
    start().catch(() => {
      problem = "Listening stopped. Tap the mic to carry on.";
      active = false;
      finish();
    });
  }

  function finish() {
    if (finished) return;
    finished = true;
    listeners.forEach((l) => l.remove());
    onEnd(committed, problem);
  }

  try {
    await start();
  } catch (e) {
    listeners.forEach((l) => l.remove());
    throw e instanceof Error ? e : new Error("Couldn't start listening.");
  }

  return {
    stop() {
      active = false;
      if (restartPending) {
        restartPending = false;
        return finish();
      }
      SpeechRecognition.stop().catch(() => finish());
      // If the recogniser never reports that it stopped, finish anyway with what was heard.
      setTimeout(() => {
        committed = joinSpoken(committed, current);
        current = "";
        finish();
      }, 2500);
    },
  };
}
