// The web version's quote PDF. In a Home Screen web app Safari lets a page open the print screen once and then asks
// "Allow printing?" every time after, and it prints the web address in the footer. So the web version makes the PDF
// itself: the quote is laid out at A4 width in a hidden frame, drawn to an image, cut into A4 pages between lines
// (never through one), and saved as a PDF that the Share sheet can send. (The iPhone app has a native PDF instead.)

const PAGE_W = 595.28; // A4, in points
const PAGE_H = 841.89;
const MARGIN_X = 36;
const MARGIN_Y = 40;
const CONTENT_W_PX = 700; // the width the quote is laid out at (desktop-like, like the printed copy)

// Blocks a page break may fall after, never inside; and blocks kept whole on one page (the totals, the closing box).
const BLOCKS = "header, section, h1, h2, h3, h4, p, li, tr, dt, dd, figure, img, [data-pdf-block]";
const KEEP = "[data-pdf-keep]";

const contentW = PAGE_W - 2 * MARGIN_X;
const ptPerPx = contentW / CONTENT_W_PX;

/** Makes an A4 PDF of `article` (the quote document). Takes a second or two. */
export async function quotePdf(article: HTMLElement): Promise<Uint8Array> {
  const [{ jsPDF }, pages] = await Promise.all([import("jspdf"), quotePages(article)]);
  const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
  pages.forEach((page, i) => {
    if (i) pdf.addPage();
    pdf.addImage(page.toDataURL("image/jpeg", 0.9), "JPEG", MARGIN_X, MARGIN_Y, contentW, page.height / 2 * ptPerPx);
  });
  return new Uint8Array(pdf.output("arraybuffer"));
}

/** The quote drawn as A4 page images (2× scale), cut between lines. */
export async function quotePages(article: HTMLElement): Promise<HTMLCanvasElement[]> {
  const { default: html2canvas } = await import("html2canvas-pro");
  const frame = await layOut(article);
  try {
    const doc = frame.contentDocument!;
    const copy = doc.querySelector<HTMLElement>("article")!;
    const top = copy.getBoundingClientRect().top;
    const height = copy.scrollHeight;
    const box = (el: Element) => el.getBoundingClientRect();
    const kept = [...copy.querySelectorAll(KEEP)].map((el) => [box(el).top - top, box(el).bottom - top] as const);
    const breaks = [...copy.querySelectorAll<HTMLElement>(BLOCKS)]
      .map((el) => Math.round(box(el).bottom - top))
      .filter((y) => y > 0 && y < height && !kept.some(([a, b]) => y > a + 1 && y < b - 1))
      .concat(kept.map(([a]) => Math.round(a)).filter((y) => y > 0)) // a kept block may start a new page
      .sort((a, b) => a - b);

    const scale = 2;
    const canvas = await html2canvas(copy, {
      scale,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      windowWidth: CONTENT_W_PX,
    });

    const pageHPx = Math.floor((PAGE_H - 2 * MARGIN_Y) / ptPerPx);
    const pages: HTMLCanvasElement[] = [];
    let start = 0;
    while (start < height - 1) {
      let end = Math.min(start + pageHPx, height);
      if (end < height) {
        // The last line ending on this page, as long as it fills at least half of it.
        const fit = breaks.filter((y) => y > start + pageHPx / 2 && y <= end).pop();
        if (fit) end = fit;
      }
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = Math.round((end - start) * scale);
      slice.getContext("2d")!.drawImage(canvas, 0, -Math.round(start * scale));
      pages.push(slice);
      start = end;
    }
    return pages;
  } finally {
    frame.remove();
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
    .no-print { display: none !important; }
    main { max-width: none !important; padding: 0 !important; margin: 0 !important; min-height: 0 !important; }
    article { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; padding: 0 !important; }
  `;
  doc.head.append(extra);
  const themed = article.closest<HTMLElement>("[data-astryx-theme]");
  const copy = (themed ?? article).cloneNode(true) as HTMLElement;
  copy.style.minHeight = "0";
  doc.documentElement.setAttribute("data-theme", "light");
  doc.body.append(copy);

  await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 1500))]);
  await doc.fonts?.ready;
  await Promise.all(
    [...doc.images].map((img) => (img.complete ? null : new Promise((r) => img.addEventListener("load", r, { once: true })))),
  );
  // Reading the height lays the copy out; no need to wait for a redraw (which never comes in a background tab).
  frame.style.height = `${doc.documentElement.scrollHeight}px`;
  return frame;
}
