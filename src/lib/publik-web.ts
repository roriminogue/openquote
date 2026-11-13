// Sign in with publik for the web version (the Home Screen app). The same steps and words as publik's module, which
// the iPhone app runs natively (ios/App/App/Publik.swift):
//   1. loads or provisions this install's publik key (POST /installs);
//   2. shows Sign in with publik until GET /wallet says "claimed";
//   3. asks once how the app pays for AI (publik plan or own key) and remembers the answer;
//   4. counts usage: app_opened now, active_session every 30 minutes (POST /telemetry).
// Calls go through the site's relay (/publik → publikhq.com/api/v1, functions/publik), because publik's API doesn't
// accept calls from web pages directly. The key is kept in this app's storage on the phone.
// The gate only runs once the build carries publik's app token (publik-app-token.txt at the repo root, which
// publik issues when the app is listed); until then the app runs on the person's own AI key.

import type { PublikScreen } from "./publik";

export const APP_SLUG = "openquote-au";
const APP_VERSION = "1.0.1";
const RELAY = "/publik";
// publik API paths. The relay on this site (functions/publik) maps /publik/<x> to publikhq.com/api/v1/<x>.
const INSTALLS = "/api/v1/installs";
const WALLET = "/api/v1/wallet";
const TELEMETRY = "/api/v1/telemetry";
const ORIGIN = "https://publikhq.com";
const CREDENTIAL = "oq-publik-credential";
const TELEMETRY_ID = "oq-publik-telemetry-id";

const tokenFiles = import.meta.glob<string>("/publik-app-token.txt", { query: "?raw", import: "default", eager: true });
const APP_TOKEN = (Object.values(tokenFiles)[0] ?? import.meta.env.VITE_PUBLIK_APP_TOKEN ?? "").trim();

/** True when this build carries publik's app token, so the gate runs. */
export const webConfigured = () => APP_TOKEN.startsWith("pat_");

/** The base URL for publik API calls from this page (the relay on this site). */
export const webPublikBaseUrl = () => `${location.origin}${RELAY}`;

type Credential = { key: string; base_url: string; install_id: string; claim_url?: string | null; choice?: string | null };
type Wallet = { claimed: boolean; claimUrl?: string; handle?: string; planKind: string; planLabel?: string; balanceMicros: number; topUpUrl: string };

function readCredential(): Credential | null {
  try {
    const c = JSON.parse(localStorage.getItem(CREDENTIAL) ?? "null") as Credential | null;
    return c?.key?.startsWith("pk_") ? c : null;
  } catch {
    return null;
  }
}
function writeCredential(c: Credential | null) {
  try {
    if (c) localStorage.setItem(CREDENTIAL, JSON.stringify(c));
    else localStorage.removeItem(CREDENTIAL);
  } catch {
    // storage blocked: the person signs in again next time
  }
}

/** The key for publik API, when the person chose to pay with their publik plan. */
export function webPublikKey(): string | null {
  const c = readCredential();
  return c?.choice === "publik" ? c.key : null;
}

/** Settings → AI: pay with the publik plan, use my own key, or ask again on the next start. */
export function webSetChoice(choice: string | null) {
  const c = readCredential();
  if (c) writeCredential({ ...c, choice });
}

class Unreachable extends Error {}

async function call(method: "GET" | "POST", path: string, { body, key, timeout = 20_000 }: { body?: unknown; key?: string; timeout?: number } = {}) {
  let res: Response;
  try {
    res = await fetch(`${RELAY}/${path.replace(/^\/api\/v1\//, "")}`, {
      method,
      headers: { "content-type": "application/json", ...(key ? { authorization: `Bearer ${key}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });
  } catch {
    throw new Unreachable();
  }
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, body: json };
}

const errorOf = (b: Record<string, unknown>) => (b.error ?? {}) as { type?: string; message?: string; top_up_url?: string };

function platform() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return { os: "ios", device: /iPad/.test(ua) ? "iPad" : "iPhone" };
  if (/Android/.test(ua)) return { os: "android", device: "Android phone" };
  if (/Mac/.test(ua)) return { os: "macos", device: "Mac" };
  if (/Windows/.test(ua)) return { os: "windows", device: "Windows PC" };
  return { os: "linux", device: "Computer" };
}

/** POST /installs: this install's publik key. */
async function provision(): Promise<Credential> {
  if (!webConfigured()) throw new Error("This build has no publik app token.");
  const prior = readCredential();
  let installId = prior?.install_id ?? crypto.randomUUID();
  const { os, device } = platform();
  for (let i = 0; i < 2; i++) {
    const { status, body } = await call("POST", INSTALLS, {
      body: {
        app_token: APP_TOKEN,
        app_slug: APP_SLUG,
        app_version: APP_VERSION,
        os,
        install_id: installId,
        device_name: `${device} (web)`,
        disclosure_version: 1,
        dialects: ["chat_completions"],
      },
    });
    const key = (body.key as string | undefined) ?? (status === 200 ? prior?.key : undefined);
    if ((status === 200 || status === 201) && key) {
      const c: Credential = {
        key,
        base_url: (body.base_url as string) ?? `${ORIGIN}/api/v1`,
        install_id: (body.install_id as string) ?? installId,
        claim_url: (body.claim_url as string) ?? null,
        choice: prior?.choice ?? null,
      };
      writeCredential(c);
      return c;
    }
    if (status === 200 || errorOf(body).type === "install_revoked") {
      installId = crypto.randomUUID();
      continue;
    }
    throw new Error(errorOf(body).message ?? `publik could not set up this app (${status}).`);
  }
  throw new Error("publik could not set up this app.");
}

/** GET /wallet. */
async function readWallet(key: string): Promise<{ status: number; wallet: Wallet | null; message?: string }> {
  const { status, body } = await call("GET", WALLET, { key, timeout: 15_000 });
  if (status !== 200 || typeof body.claim_state !== "string") return { status, wallet: null, message: errorOf(body).message };
  const plan = (body.plan ?? {}) as { kind?: string; label?: string };
  return {
    status,
    wallet: {
      claimed: body.claim_state === "claimed",
      claimUrl: body.claim_url as string | undefined,
      handle: (body.account as { handle?: string } | undefined)?.handle,
      planKind: plan.kind ?? "none",
      planLabel: plan.label,
      balanceMicros: Number(body.balance_micros ?? 0),
      topUpUrl: (body.top_up_url as string) ?? `${ORIGIN}/wallet`,
    },
  };
}

/** The words of the gate, the same as in every publik module (the web version says "this app", not "this window"). */
function gateScreen(id: "sign_in" | "unreachable" | "choose", w?: Wallet | null, note?: string | null, message?: string | null): PublikScreen {
  if (id === "unreachable")
    return { id, title: "Sign in with publik", body: message ?? "publik is not reachable. Check your connection.", note, buttons: [{ action: "retry", label: "Retry" }] };
  if (id === "sign_in") {
    // After the first try the person is usually signed in already, and publik's page then shows "Link this
    // computer" straight away (publik's Google and GitHub sign-in land on the wallet instead).
    const again = !!note;
    return {
      id,
      title: "Sign in with publik",
      body: again
        ? "Signed in, but publik showed your wallet? Tap Link this phone, then Link this computer on the publik page, then Done."
        : "This app uses your publik account. Tap Sign in with publik and sign in, then tap Done at the top to come back. The app carries on by itself.",
      note,
      buttons: [{ action: "sign_in", label: again ? "Link this phone" : "Sign in with publik" }],
    };
  }
  const who = w?.handle ? `You are signed in as @${w.handle}.` : "You are signed in to publik.";
  if (!w || (w.planKind === "none" && w.balanceMicros <= 0))
    return {
      id,
      title: "Choose how to pay for AI",
      body: `${who} This app uses AI. Get a publik plan, or use your own key.`,
      note,
      buttons: [
        { action: "get_plan", label: "Get a plan" },
        { action: "own_key", label: "Use my own key" },
      ],
    };
  const what = w.planKind === "plan" ? `Your plan: ${w.planLabel ?? "publik"}.` : `Your balance: $${(w.balanceMicros / 1_000_000).toFixed(2)}.`;
  return {
    id,
    title: "Connect your plan",
    body: `${who} ${what} Connect it to use AI in this app, or use your own key.`,
    note,
    buttons: [
      { action: "connect", label: "Connect your plan" },
      { action: "own_key", label: "Use my own key" },
    ],
  };
}

// The button the person pressed on the screen showing now.
let press: ((action: string | null) => void) | null = null;
export function webPress(action: string | null) {
  press?.(action);
}

/** Waits `ms`, or less when the person comes back to the app (from publik's page), so it moves on straight away. */
function waitOrReturn(ms: number) {
  return new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onShow);
      window.removeEventListener("focus", done);
      resolve();
    };
    const onShow = () => document.visibilityState === "visible" && done();
    const timer = setTimeout(done, ms);
    document.addEventListener("visibilitychange", onShow);
    window.addEventListener("focus", done);
  });
}

/** Shows a screen; with `until`, also polls GET /wallet every 3 s for at most 10 minutes. */
async function ask(show: (s: PublikScreen) => void, screen: PublikScreen, key = "", until?: (w: Wallet) => boolean): Promise<string> {
  let stop = false;
  const pressed = new Promise<string>((resolve) => {
    press = (a) => resolve(a ?? "retry");
  });
  show(screen);
  const polled = until
    ? (async () => {
        for (let i = 0; i < 200 && !stop; i++) {
          await waitOrReturn(3000);
          if (stop) break;
          const w = await readWallet(key).then((r) => r.wallet).catch(() => null);
          if (w && until(w)) return "done";
        }
        return stop ? new Promise<string>(() => {}) : "timeout";
      })()
    : new Promise<string>(() => {});
  try {
    return await Promise.race([pressed, polled]);
  } finally {
    stop = true;
    press = null;
  }
}

// One gate at a time: a second start (React runs effects twice in development) shares the first and its screens.
let running: Promise<{ signedIn: boolean; choice: string | null }> | null = null;
let showing: (s: PublikScreen) => void = () => {};

/** The gate. Resolves once the person is signed in (straight away when this build isn't set up for publik). */
export function webEnsureSignedIn(show: (s: PublikScreen) => void): Promise<{ signedIn: boolean; choice: string | null }> {
  showing = show;
  running ??= gate((s) => showing(s)).finally(() => (running = null));
  return running;
}

async function gate(show: (s: PublikScreen) => void): Promise<{ signedIn: boolean; choice: string | null }> {
  if (!webConfigured()) return { signedIn: true, choice: null };
  let signNote: string | null = null;
  let signPoll = true;
  let planNote: string | null = null;
  let planPoll = false;
  const hasPlan = (w: Wallet) => w.planKind !== "none" || w.balanceMicros > 0;
  for (;;) {
    let c: Credential;
    let r: Awaited<ReturnType<typeof readWallet>>;
    try {
      c = readCredential() ?? (await provision());
      r = await readWallet(c.key);
    } catch (e) {
      await ask(show, gateScreen("unreachable", null, null, e instanceof Unreachable ? null : (e as Error).message));
      continue;
    }
    if (r.status === 401) {
      writeCredential(null); // a revoked key: provision again
      continue;
    }
    const w = r.wallet;
    if (!w) {
      await ask(show, gateScreen("unreachable", null, null, r.message));
      continue;
    }
    if (!w.claimed) {
      const a = await ask(show, gateScreen("sign_in", w, signNote), c.key, signPoll ? (x) => x.claimed : undefined);
      if (a === "sign_in") {
        window.open(w.claimUrl ?? c.claim_url ?? `${ORIGIN}/wallet`, "_blank", "noopener");
        signNote = "Signed in? Tap Done at the top of the publik page to come back here.";
        signPoll = true;
      }
      if (a === "timeout") {
        signNote = "No sign-in after 10 minutes. Tap Sign in with publik to try again.";
        signPoll = false;
      }
      continue;
    }
    let choice = readCredential()?.choice ?? null;
    if (!choice) {
      if (hasPlan(w)) {
        planNote = null;
        planPoll = false;
      }
      const a = await ask(show, gateScreen("choose", w, planNote), c.key, planPoll ? hasPlan : undefined);
      planNote = null;
      planPoll = false;
      if (a === "get_plan") {
        window.open(w.topUpUrl, "_blank", "noopener");
        planNote = "Got your plan? Tap Done at the top of the publik page to come back here.";
        planPoll = true;
      }
      if (a === "timeout") planNote = "No plan after 10 minutes. Tap Get a plan to try again.";
      if (a !== "connect" && a !== "own_key") continue;
      choice = a === "connect" ? "publik" : "own_key";
      webSetChoice(choice);
    }
    startTelemetry();
    return { signedIn: true, choice };
  }
}

// ---------- usage counting (publik /skills/telemetry.md): app_opened, then active_session every 30 minutes ----------
let telemetryStarted = false;

function telemetryInstallId() {
  try {
    const saved = localStorage.getItem(TELEMETRY_ID);
    if (saved && /^[0-9a-f-]{36}$/.test(saved)) return saved;
    const fresh = crypto.randomUUID();
    localStorage.setItem(TELEMETRY_ID, fresh);
    return fresh;
  } catch {
    return crypto.randomUUID();
  }
}

async function sendEvent(event: "app_opened" | "active_session") {
  if (navigator.doNotTrack === "1" || (globalThis as { GlobalPrivacyControl?: boolean }).GlobalPrivacyControl) return;
  const key = readCredential()?.key;
  await call("POST", TELEMETRY, {
    key,
    timeout: 5000,
    body: { v: 1, app: APP_SLUG, install_id: telemetryInstallId(), event, app_version: APP_VERSION, os: platform().os },
  }).catch(() => {});
}

function startTelemetry() {
  if (telemetryStarted) return;
  telemetryStarted = true;
  void sendEvent("app_opened");
  setInterval(() => void sendEvent("active_session"), 30 * 60 * 1000);
}
