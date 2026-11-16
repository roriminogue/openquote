import "@fontsource-variable/figtree";
import "./app/globals.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/app";
import { hideSplash } from "./lib/splash";
import { keepUpToDate } from "./lib/updates";

keepUpToDate();
// Never leave the splash up, whatever happens while loading.
window.setTimeout(hideSplash, 6000);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
