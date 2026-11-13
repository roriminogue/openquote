// publik's app token (publik-app-token.txt at the top of the repo), read when the app is built. With it the app opens
// behind Sign in with publik and offers publik as an AI provider; without it (the default) the app opens straight
// away and everyone uses their own AI key. See README "Sign in with publik".
const files = import.meta.glob<string>("/publik-app-token.txt", { query: "?raw", import: "default", eager: true });

export const PUBLIK_APP_TOKEN = (Object.values(files)[0] ?? import.meta.env.VITE_PUBLIK_APP_TOKEN ?? "").trim();

/** True when this build carries publik's app token. */
export const PUBLIK_ENABLED = PUBLIK_APP_TOKEN.startsWith("pat_");
