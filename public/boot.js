// Runs before the first paint (index.html loads it in <head>): applies the saved Light or Dark choice, so the page
// never flashes the wrong colours. A file rather than an inline script so the Content-Security-Policy in
// public/_headers can forbid inline scripts. See src/components/theme.tsx.
try {
  var t = localStorage.getItem("oq-theme");
  if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
} catch {
  // Storage blocked: follow the device.
}
