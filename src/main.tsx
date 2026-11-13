import "@fontsource-variable/figtree";
import "./app/globals.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/app";
import { keepUpToDate } from "./lib/updates";

keepUpToDate();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
