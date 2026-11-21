// The web version's quote PDF. In a Home Screen web app Safari lets a page open the print screen once and then asks
// "Allow printing?" every time after, and it prints the web address in the footer. So the web version makes the PDF
// itself: the quote is laid out at A4 width in a hidden frame, cut into A4 pages between lines (never through one),
// and written out as real text in Figtree, with its lines, shading, logo and links, where the page put them. Text
// means the PDF can be searched, copied from, read aloud, and changed in a PDF editor. (If the fonts can't be loaded
// it falls back to drawing each page as an image. The iPhone app has a native PDF instead.)

import type { jsPDF } from "jspdf";

const PAGE_W = 595.28; // A4, in points
const PAGE_H = 841.89;
const MARGIN_X = 36;
const MARGIN_Y = 40;
const CONTENT_W_PX = 700; // the width the quote is laid out at (desktop-like, like the printed copy)

// Blocks a page break may fall after, never inside (not after a heading or a label: they stay with what follows);
// and blocks kept whole on one page (the totals, the scope columns, the closing box).
const BLOCKS = "header, section, p, li, tr, dd, figure, img, [data-pdf-block]";
const KEEP = "[data-pdf-keep]";

const contentW = PAGE_W - 2 * MARGIN_X;
const ptPerPx = contentW / CONTENT_W_PX;

/**
 * Makes an A4 PDF of `article`: the quote document, or any part of a screen (Print uses the estimate page). It's
 * drawn light whatever the app's theme, without the parts marked no-print. Takes a second or so.
 */
export async function quotePdf(article: HTMLElement, info: { title?: string; author?: string } = {}): Promise<Uint8Array> {
  const [{ jsPDF }, fonts] = await Promise.all([import("jspdf"), pdfFonts().catch(() => null)]);
  const frame = await layOut(article);
  try {
    const root = frame.contentDocument!.querySelector<HTMLElement>("[data-pdf-root]")!;
    const cuts = pageCuts(root);
    const make = () => {
      const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
      pdf.setProperties({ title: info.title ?? "", author: info.author ?? "", creator: "OpenQuote AU" });
      return pdf;
    };
    if (fonts) {
      try {
        const pdf = make();
        await writeAsText(pdf, frame, root, cuts, fonts);
        return new Uint8Array(pdf.output("arraybuffer"));
      } catch (e) {
        console.warn("Text PDF failed, drawing the pages as images instead", e);
      }
    }
    const pdf = make();
    const pages = await drawPages(root, cuts);
    pages.forEach((page, i) => {
      if (i) pdf.addPage();
      pdf.addImage(page.toDataURL("image/jpeg", 0.9), "JPEG", MARGIN_X, MARGIN_Y, contentW, (page.height / 2) * ptPerPx);
    });
    return new Uint8Array(pdf.output("arraybuffer"));
  } finally {
    frame.remove();
  }
}

/** Where each A4 page starts and ends down the laid-out copy (CSS px from its top), cut between lines. */
type Cut = { start: number; end: number };

function pageCuts(copy: HTMLElement): Cut[] {
  const top = copy.getBoundingClientRect().top;
  const height = copy.scrollHeight;
  const box = (el: Element) => el.getBoundingClientRect();
  const kept = [...copy.querySelectorAll(KEEP)].map((el) => [box(el).top - top, box(el).bottom - top] as const);
  const breaks = [...copy.querySelectorAll<HTMLElement>(BLOCKS)]
    .map((el) => Math.round(box(el).bottom - top))
    .filter((y) => y > 0 && y < height && !kept.some(([a, b]) => y > a + 1 && y < b - 1))
    .concat(kept.map(([a]) => Math.round(a)).filter((y) => y > 0)) // a kept block may start a new page
    .sort((a, b) => a - b);

  const pageHPx = Math.floor((PAGE_H - 2 * MARGIN_Y) / ptPerPx);
  const cuts: Cut[] = [];
  let start = 0;
  while (start < height - 1) {
    let end = Math.min(start + pageHPx, height);
    if (end < height) {
      // The last line ending on this page, as long as it fills at least half of it.
      const fit = breaks.filter((y) => y > start + pageHPx / 2 && y <= end).pop();
      if (fit) end = fit;
    }
    cuts.push({ start, end });
    start = end;
  }
  return cuts.length ? cuts : [{ start: 0, end: height }];
}

/** The fallback: each page drawn as an image (2× scale). */
async function drawPages(copy: HTMLElement, cuts: Cut[]): Promise<HTMLCanvasElement[]> {
  const { default: html2canvas } = await import("html2canvas-pro");
  const scale = 2;
  const canvas = await html2canvas(copy, {
    scale,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    windowWidth: CONTENT_W_PX,
  });
  return cuts.map(({ start, end }) => {
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = Math.round((end - start) * scale);
    slice.getContext("2d")!.drawImage(canvas, 0, -Math.round(start * scale));
    return slice;
  });
}

// ---- Text ----

const SVG_NS = "http://www.w3.org/2000/svg";
const WEIGHTS = ["Regular", "Medium", "SemiBold"] as const;
// Each weight also comes with tabular figures (digits all one width), which the app uses for prices.
const FACES = WEIGHTS.flatMap((w) => [w, `${w}-Tnum`] as const);
type Face = (typeof FACES)[number];
type Fonts = Record<Face, string>;

// Figtree's line box (OS/2 typo metrics, which it says to use): 0.95em above the baseline, 0.25em below.
const ASCENT = 0.95;
const CONTENT = 1.2;

let fontFiles: Promise<Fonts> | null = null;

/** Figtree at the quote's three weights as jsPDF wants them (binary strings), fetched once (and kept offline). */
function pdfFonts(): Promise<Fonts> {
  fontFiles ??= Promise.all(
    FACES.map(async (w) => {
      const res = await fetch(`/fonts/pdf/Figtree-${w}.ttf`);
      if (!res.ok) throw new Error(`Couldn't load the PDF font (${res.status})`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      let s = "";
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return [w, s] as const;
    }),
  ).then((entries) => Object.fromEntries(entries) as Fonts);
  fontFiles.catch(() => (fontFiles = null)); // try again next time
  return fontFiles;
}

type RGB = [number, number, number];
type Op =
  | { kind: "fill"; x: number; y: number; w: number; h: number; r: number; color: RGB }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; width: number; color: RGB; dash: number[] }
  | { kind: "frame"; x: number; y: number; w: number; h: number; r: number; width: number; color: RGB; dash: number[] }
  | { kind: "image"; x: number; y: number; w: number; h: number; data: string }
  | { kind: "text"; x: number; y: number; text: string; face: Face; size: number; color: RGB; charSpace: number }
  | { kind: "link"; x: number; y: number; w: number; h: number; url: string };

/**
 * Writes the laid-out copy into `pdf` page by page: every element's shading, borders, pictures and links, then its
 * text line by line, each placed where the browser put it, in the same weight, size and colour, and stretched by a
 * hair to the browser's exact width (jsPDF doesn't kern or use tabular figures), so columns of prices still line up.
 */
async function writeAsText(pdf: jsPDF, frame: HTMLIFrameElement, root: HTMLElement, cuts: Cut[], fonts: Fonts) {
  for (const f of FACES) {
    pdf.addFileToVFS(`Figtree-${f}.ttf`, fonts[f]);
    pdf.addFont(`Figtree-${f}.ttf`, `Figtree-${f}`, "normal");
  }
  const win = frame.contentWindow!;
  const origin = root.getBoundingClientRect();
  const pages: Op[][] = cuts.map(() => []);
  const pageAt = (y: number) => {
    const i = cuts.findIndex((c) => y >= c.start && y < c.end);
    return i === -1 ? cuts.length - 1 : i;
  };
  const px = (x: number) => MARGIN_X + (x - origin.left) * ptPerPx;
  const py = (y: number, page: number) => MARGIN_Y + (y - origin.top - cuts[page].start) * ptPerPx;
  const style = (el: Element) => win.getComputedStyle(el);
  const hidden = hiddenCheck(root, style);

  for (const el of [root, ...root.querySelectorAll<HTMLElement | SVGElement>("*")]) {
    // An icon's insides are drawn with its <svg>.
    if (el.namespaceURI === SVG_NS && (el.tagName.toLowerCase() !== "svg" || el.parentElement?.closest("svg"))) continue;
    if (!el.getClientRects().length || hidden(el)) continue;
    const cs = style(el);
    if (cs.visibility !== "visible") continue;
    const b = el.getBoundingClientRect();
    if (b.width < 0.5 || b.height < 0.5) continue;
    const top = b.top - origin.top;
    const bottom = b.bottom - origin.top;

    // Shading (on white paper; white itself is skipped).
    const bg = rgba(cs.backgroundColor);
    if (bg && !isWhite(bg)) {
      const r = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, b.width / 2, b.height / 2);
      cuts.forEach((c, i) => {
        const y1 = Math.max(top, c.start);
        const y2 = Math.min(bottom, c.end);
        if (y2 - y1 < 0.5) return;
        const whole = y1 === top && y2 === bottom;
        pages[i].push({
          kind: "fill",
          x: px(b.left),
          y: py(y1 + origin.top, i),
          w: b.width * ptPerPx,
          h: (y2 - y1) * ptPerPx,
          r: whole ? r * ptPerPx : 0,
          color: bg,
        });
      });
    }

    // Borders: the same all round (with its corners) as one frame, otherwise each side as a line.
    const sides = (["Top", "Right", "Bottom", "Left"] as const).map((s) => ({
      side: s,
      width: parseFloat(cs.getPropertyValue(`border-${s.toLowerCase()}-width`)) || 0,
      style: cs.getPropertyValue(`border-${s.toLowerCase()}-style`),
      color: rgba(cs.getPropertyValue(`border-${s.toLowerCase()}-color`)),
    }));
    const drawn = sides.filter((s) => s.width > 0 && s.color && ["solid", "dashed", "dotted"].includes(s.style));
    const dash = (s: (typeof sides)[number]) =>
      s.style === "dashed" ? [3 * s.width * ptPerPx, 3 * s.width * ptPerPx] : s.style === "dotted" ? [s.width * ptPerPx, s.width * ptPerPx] : [];
    const same =
      drawn.length === 4 && drawn.every((s) => s.width === drawn[0].width && s.style === drawn[0].style && s.color!.join() === drawn[0].color!.join());
    const page = pageAt(top);
    if (same && pageAt(bottom - 0.5) === page) {
      const w = drawn[0].width;
      pages[page].push({
        kind: "frame",
        x: px(b.left + w / 2),
        y: py(b.top + w / 2, page),
        w: (b.width - w) * ptPerPx,
        h: (b.height - w) * ptPerPx,
        r: Math.max(0, Math.min(parseFloat(cs.borderTopLeftRadius) || 0, b.width / 2, b.height / 2) - w / 2) * ptPerPx,
        width: w * ptPerPx,
        color: drawn[0].color!,
        dash: dash(drawn[0]),
      });
    } else {
      for (const s of drawn) {
        const w = s.width;
        const line = (x1: number, y1: number, x2: number, y2: number, at: number) => {
          const i = pageAt(at);
          pages[i].push({
            kind: "line",
            x1: px(x1),
            y1: py(y1, i),
            x2: px(x2),
            y2: py(y2, i),
            width: w * ptPerPx,
            color: s.color!,
            dash: dash(s),
          });
        };
        if (s.side === "Top") line(b.left, b.top + w / 2, b.right, b.top + w / 2, top);
        else if (s.side === "Bottom") line(b.left, b.bottom - w / 2, b.right, b.bottom - w / 2, bottom - w);
        else {
          const x = s.side === "Left" ? b.left + w / 2 : b.right - w / 2;
          cuts.forEach((c) => {
            const y1 = Math.max(top, c.start);
            const y2 = Math.min(bottom, c.end);
            if (y2 - y1 >= 0.5) line(x, y1 + origin.top, x, y2 + origin.top, y1);
          });
        }
      }
    }

    // Pictures: the logo, and any icon (drawn sharp at 4×).
    const tag = el.tagName.toLowerCase();
    if (tag === "img" || tag === "svg") {
      const data = await pictureData(el as HTMLImageElement | SVGSVGElement, b, cs.color);
      if (data) {
        const fit = tag === "img" ? contain(el as HTMLImageElement, b) : b;
        pages[page].push({
          kind: "image",
          x: px(fit.left),
          y: py(fit.top, page),
          w: fit.width * ptPerPx,
          h: fit.height * ptPerPx,
          data,
        });
      }
    }

    // Links (the phone number and email) stay tappable; links within the app (to a stage, say) mean nothing on paper.
    if (tag === "a") {
      const url = (el as HTMLAnchorElement).href;
      if (/^(mailto:|tel:)/.test(url) || (/^https?:/.test(url) && new URL(url).origin !== window.location.origin))
        pages[page].push({ kind: "link", x: px(b.left), y: py(b.top, page), w: b.width * ptPerPx, h: b.height * ptPerPx, url });
    }
  }

  // Text, line by line.
  const doc = frame.contentDocument!;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = doc.createRange();
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const parent = node.parentElement;
    if (!parent || !/\S/.test(node.data) || parent.closest("svg") || hidden(parent)) continue;
    const cs = style(parent);
    if (cs.visibility !== "visible" || !parent.getClientRects().length) continue;
    const words: { text: string; left: number; right: number; top: number; height: number; glued?: boolean }[] = [];
    // A space at the very start or end of this piece of text (" · 12 hrs") is kept, so the words around it don't
    // run together when the PDF's text is copied.
    const space = (at: number, near: number) => {
      if (at < 0 || at >= node!.data.length || /\S/.test(node!.data[at])) return null;
      range.setStart(node!, at);
      range.setEnd(node!, at + 1);
      const r = range.getClientRects()[0];
      return r && r.width > 0 && Math.abs(r.top - near) < 2 ? r : null;
    };
    for (const m of node.data.matchAll(/\S+/g)) {
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0);
      if (rects.length === 1) {
        const r = rects[0];
        words.push({ text: m[0], left: r.left, right: r.right, top: r.top, height: r.height });
      } else if (rects.length > 1) {
        // A word broken over lines (an email address): place it letter by letter.
        for (let i = 0; i < m[0].length; i++) {
          range.setStart(node, m.index + i);
          range.setEnd(node, m.index + i + 1);
          const r = range.getClientRects()[0];
          if (r) words.push({ text: m[0][i], left: r.left, right: r.right, top: r.top, height: r.height, glued: i > 0 });
        }
      }
    }
    const size = parseFloat(cs.fontSize);
    const weight = Number(cs.fontWeight) >= 550 ? "SemiBold" : Number(cs.fontWeight) >= 450 ? "Medium" : "Regular";
    const face: Face = cs.fontVariantNumeric.includes("tabular-nums") ? `${weight}-Tnum` : weight;
    const color = rgba(cs.color) ?? [0, 0, 0];
    const transform = (t: string) =>
      cs.textTransform === "uppercase" ? t.toUpperCase() : cs.textTransform === "lowercase" ? t.toLowerCase() : t;
    let line: typeof words = [];
    const flush = () => {
      if (!line.length) return;
      const first = line[0];
      const last = line[line.length - 1];
      const text = transform(
        line.map((w, i) => (i && !w.glued && w.left - line[i - 1].right > 0.5 ? " " : "") + w.text).join(""),
      );
      const baseline = first.top + (first.height - CONTENT * size) / 2 + ASCENT * size;
      const i = pageAt(first.top + first.height / 2 - origin.top);
      pdf.setFont(`Figtree-${face}`, "normal");
      pdf.setFontSize(size * ptPerPx);
      const natural = pdf.getTextWidth(text);
      const target = (last.right - first.left) * ptPerPx;
      const n = [...text].length;
      let charSpace = n > 1 ? (target - natural) / (n - 1) : 0;
      if (Math.abs(charSpace) > size * ptPerPx * 0.08) charSpace = 0; // the measurement is off; leave it
      pages[i].push({ kind: "text", x: px(first.left), y: py(baseline, i), text, face, size: size * ptPerPx, color, charSpace });
      line = [];
    };
    if (words.length) {
      const first = words[0];
      const last = words[words.length - 1];
      const before = space(node.data.search(/\S/) - 1, first.top);
      if (before) Object.assign(first, { text: " " + first.text, left: before.left });
      const after = space(node.data.trimEnd().length, last.top);
      if (after) Object.assign(last, { text: last.text + " ", right: after.right });
    }
    for (const w of words) {
      const prev = line[line.length - 1];
      if (prev && (Math.abs(w.top - prev.top) > 2 || w.left < prev.right - 1)) flush();
      line.push(w);
    }
    flush();
  }

  // Out to the PDF: shading first, then lines, pictures and text on top.
  cuts.forEach((_, i) => {
    if (i) pdf.addPage();
    const order = { fill: 0, frame: 1, line: 1, image: 2, text: 3, link: 4 } as const;
    for (const op of pages[i].sort((a, b) => order[a.kind] - order[b.kind])) {
      if (op.kind === "fill") {
        pdf.setFillColor(...op.color);
        if (op.r > 0.2) pdf.roundedRect(op.x, op.y, op.w, op.h, op.r, op.r, "F");
        else pdf.rect(op.x, op.y, op.w, op.h, "F");
      } else if (op.kind === "line" || op.kind === "frame") {
        pdf.setDrawColor(...op.color);
        pdf.setLineWidth(op.width);
        pdf.setLineDashPattern(op.dash, 0);
        if (op.kind === "line") pdf.line(op.x1, op.y1, op.x2, op.y2);
        else if (op.r > 0.2) pdf.roundedRect(op.x, op.y, op.w, op.h, op.r, op.r, "S");
        else pdf.rect(op.x, op.y, op.w, op.h, "S");
        pdf.setLineDashPattern([], 0);
      } else if (op.kind === "image") {
        pdf.addImage(op.data, "PNG", op.x, op.y, op.w, op.h);
      } else if (op.kind === "text") {
        pdf.setFont(`Figtree-${op.face}`, "normal");
        pdf.setFontSize(op.size);
        pdf.setTextColor(...op.color);
        pdf.text(op.text, op.x, op.y, { charSpace: op.charSpace, baseline: "alphabetic" });
      } else {
        pdf.link(op.x, op.y, op.w, op.h, { url: op.url });
      }
    }
  });
}

/** Whether an element is out of sight: inside a box shrunk to nothing (screen-reader-only text) or clipped away. */
function hiddenCheck(root: HTMLElement, style: (el: Element) => CSSStyleDeclaration) {
  const seen = new Map<Element, boolean>();
  const check = (el: Element | null): boolean => {
    if (!el || el === root.parentElement) return false;
    if (seen.has(el)) return seen.get(el)!;
    const cs = style(el);
    const b = el.getBoundingClientRect();
    const out =
      cs.display === "none" ||
      Number(cs.opacity) === 0 ||
      (cs.overflow !== "visible" && (b.width <= 1 || b.height <= 1)) ||
      (cs.clip !== "auto" && cs.clip !== "" && cs.position === "absolute") ||
      check(el.parentElement);
    seen.set(el, out);
    return out;
  };
  return check;
}

const colorCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
const colorCache = new Map<string, RGB | null>();

/** Any CSS colour (oklch, color-mix, …) as RGB on white paper, or null when it's transparent. */
function rgba(css: string): RGB | null {
  if (!css || css === "transparent" || css === "rgba(0, 0, 0, 0)") return null;
  const hit = colorCache.get(css);
  if (hit !== undefined) return hit;
  let out: RGB | null = null;
  const ctx = colorCanvas && ((colorCanvas.width = colorCanvas.height = 1), colorCanvas.getContext("2d", { willReadFrequently: true }));
  if (ctx) {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    // Fully transparent paints nothing: the pixel stays white, and so is skipped as shading anyway.
    out = [r, g, b];
  }
  colorCache.set(css, out);
  return out;
}

const isWhite = ([r, g, b]: RGB) => r >= 254 && g >= 254 && b >= 254;

/** The part of an <img> box its picture fills (object-fit: contain keeps the picture's shape). */
function contain(img: HTMLImageElement, b: DOMRect) {
  const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : b.width / b.height;
  let w = b.width;
  let h = w / ratio;
  if (h > b.height) {
    h = b.height;
    w = h * ratio;
  }
  return { left: b.left + (b.width - w) / 2, top: b.top + (b.height - h) / 2, width: w, height: h };
}

/** A picture as a PNG data URL, drawn at 4× its size on the page: an <img>, or an icon <svg> in its text colour. */
async function pictureData(el: HTMLImageElement | SVGSVGElement, b: DOMRect, color: string): Promise<string | null> {
  try {
    let img: HTMLImageElement;
    if (el.tagName.toLowerCase() === "svg") {
      const copy = el.cloneNode(true) as SVGSVGElement;
      copy.setAttribute("width", String(b.width));
      copy.setAttribute("height", String(b.height));
      copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      copy.style.color = color;
      const xml = new XMLSerializer().serializeToString(copy).replace(/currentColor/g, color);
      img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
    } else {
      img = el as HTMLImageElement;
    }
    await (img.complete && img.naturalWidth ? Promise.resolve() : img.decode());
    const scale = 4;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(b.width * scale));
    canvas.height = Math.max(1, Math.round(b.height * scale));
    const ctx = canvas.getContext("2d")!;
    if (el.tagName.toLowerCase() === "img") {
      const fit = contain(el as HTMLImageElement, b);
      canvas.width = Math.max(1, Math.round(fit.width * scale));
      canvas.height = Math.max(1, Math.round(fit.height * scale));
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/** A hidden frame CONTENT_W_PX wide holding a copy of the quote with the page's styles, laid out like the print. */
async function layOut(article: HTMLElement): Promise<HTMLIFrameElement> {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  Object.assign(frame.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: `${CONTENT_W_PX}px`,
    height: "1200px",
    border: "0",
    visibility: "hidden",
  });
  document.body.append(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write("<!doctype html><html><head></head><body></body></html>");
  doc.close();

  // The page's styles, the light theme's wrapper (its colours and fonts), and the print look: no card around it.
  const loads: Promise<unknown>[] = [];
  for (const node of document.querySelectorAll('link[rel="stylesheet"], style')) {
    const clone = node.cloneNode(true) as HTMLElement;
    if (clone instanceof HTMLLinkElement) loads.push(new Promise((r) => clone.addEventListener("load", r, { once: true })));
    doc.head.append(clone);
  }
  const extra = doc.createElement("style");
  extra.textContent = `
    html, body { margin: 0; background: #fff; }
    .no-print, .astryx-app-shell-header, .astryx-app-shell-sidenav { display: none !important; }
    main, [data-pdf-root], [data-pdf-root] > div { max-width: none !important; padding: 0 !important; margin: 0 !important; min-height: 0 !important; height: auto !important; overflow: visible !important; }
    article { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; padding: 0 !important; }
  `;
  doc.head.append(extra);
  // The theme's wrapper (its colours and fonts) without the rest of the screen, always light: it's paper.
  const themed = article.closest<HTMLElement>("[data-astryx-theme]");
  const wrapper = (themed?.cloneNode(false) as HTMLElement | undefined) ?? doc.createElement("div");
  wrapper.setAttribute("data-theme", "light");
  wrapper.style.colorScheme = "light"; // the theme's classes set dark mode's colour scheme; this wins over them
  wrapper.style.minHeight = "0";
  wrapper.style.background = "#fff";
  const copy = article.cloneNode(true) as HTMLElement;
  copy.setAttribute("data-pdf-root", "");
  wrapper.append(copy);
  doc.documentElement.setAttribute("data-theme", "light");
  doc.documentElement.style.colorScheme = "light";
  doc.body.append(wrapper);

  await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 1500))]);
  await doc.fonts?.ready;
  await Promise.all(
    [...doc.images].map((img) => (img.complete ? null : new Promise((r) => img.addEventListener("load", r, { once: true })))),
  );
  // Reading the height lays the copy out; no need to wait for a redraw (which never comes in a background tab).
  frame.style.height = `${doc.documentElement.scrollHeight}px`;
  return frame;
}
