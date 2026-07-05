// PrintPopup.js
const { ApplicationV2 } = foundry.applications.api;

export default class PrintPopup extends ApplicationV2 {


  static DEFAULT_OPTIONS = {
    id: "qjpc-print-preview",
    classes: ["qjpc-print-modal"],
    window: {
      title: "QJPC.windows.printPreview",
      icon: "fas fa-print",
      resizable: true
    },
    position: { width: Math.min(window.innerWidth * 0.5, 1000), height: Math.min(window.innerHeight * 0.8, window.innerHeight * 0.8) }
  };
  //console.log("QJPC: Promise before")
  #previewReady = Promise.resolve();
  //console.log("QJPC: Promise after")
  /**
   * @param {string} htmlContent - Base HTML content or raw data string.
   * @param {object} pluginSettings - Plugin's configuration state/settings.
   * @param {object} [foundryOptions={}] - Optional standard Foundry window overrides. - currently not used
   */
  constructor(htmlContent, settings, foundryOptions = {}) {
    // 1. Pass the standard window options up to ApplicationV2
    super(foundryOptions);

    // 2. Store custom data and settings straight onto the instance
    this.htmlContent = htmlContent ?? "";
    this.pluginSettings = settings ?? {};
  }

  /**
   * Use stored pluginSettings to determine the HTML output logic
   */
  async _renderHTML(context, options) {
    //console.log("QJPC: render HTML")
    const title = game.i18n.localize("QJPC.windows.printPreview");
    const printLabel = game.i18n.localize("QJPC.controls.print.label");
    const cancelButton = game.i18n.localize("QJPC.settings.buttons.cancel");

    //Create HTML for iframe

    return `
          <div class="qjpc-print-preview-shell">
        <iframe class="qjpc-print-preview-frame" title="${escapeHtml(title)}"></iframe>
      </div>

      <div class="qjpc-print-actions">
      <button type="button" class="button cancel qjpc-cancel-btn">
          ${escapeHtml(cancelButton)}
        </button>

        <button type="button" class="button print qjpc-print-btn" disabled>
          <i class="fas fa-print" aria-hidden="true"></i>
          ${escapeHtml(printLabel)}
        </button>
      </div>
    `;

  }

  // At what point is replace HTML called? It overwrites the standard Foundry function
  async _replaceHTML(result, content, options) {
    content.innerHTML = result;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    //console.log("QJPC: Options", options);

    //get the iframe DOM element and only this element holds the page html for printing
    const previewFrame = this.element.querySelector(".qjpc-print-preview-frame");
    const printBtn = this.element.querySelector(".qjpc-print-btn");
    const cancelBtn = this.element.querySelector(".qjpc-cancel-btn");

    //If a iframe was found render it including the button element
    if (previewFrame) {
      this.#renderPreview(previewFrame, printBtn);
    }

    // add the listeners to the button to print out the preview iframe and only the preview iframe and to the cancel button
    if (printBtn) {
      printBtn.addEventListener("click", () => this.#printPreviewFrame(previewFrame));
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.close());
    }
  }

  #renderPreview(previewFrame, printBtn) {
    if (printBtn) printBtn.disabled = true;

    this.#previewReady = new Promise(resolve => {
      previewFrame.addEventListener("load", async () => {
        await this.#waitForPrintableAssets(previewFrame.contentDocument);
        if (printBtn) printBtn.disabled = false;
        resolve();
      }, { once: true });

      previewFrame.srcdoc = this.#buildPrintDocument();
    });
  }

  // Load Fonts and images into the iframe and do it just once with disabled print button?
  async #waitForPrintableAssets(doc) {
    if (!doc) return;

    const imageLoads = Array.from(doc.images)
      .filter(img => !img.complete)
      .map(img => new Promise(resolve => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      }));

    const fontLoad = doc.fonts?.ready ?? Promise.resolve();
    await Promise.allSettled([...imageLoads, fontLoad]);
  }

  //grabs only the ifram for printing
  async #printPreviewFrame(previewFrame) {
    if (!previewFrame?.contentWindow) return;

    await this.#previewReady;
    previewFrame.contentWindow.focus();
    previewFrame.contentWindow.print();
  }

  #buildPrintDocument() {

    const title = escapeHtml(game.i18n.localize("QJPC.windows.printPreview"));
    const baseHref = escapeHtml(document.baseURI || window.location.href);

    // Capture system themes, dark/light modes, and system definitions (e.g., "dnd5e", "theme-dark")
    const systemClasses = escapeHtml(document.body.className);

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="${baseHref}">
  <title>${title}</title>
  ${this.#styleLinks()}
  <style>${this.#basePrintCss()}</style>
  ${this.#userStyleTag()}
</head>
<body class="${systemClasses}">
  <main class="qjpc-print-document journal-entry-pages journal-entry-page prose">
    ${this.#bodyContent()}
  </main>
</body>
</html>`;

    /*
    const title = escapeHtml(game.i18n.localize("QJPC.windows.printPreview"));
    const baseHref = escapeHtml(document.baseURI || window.location.href);
    //console.log("QJPC: Baseref ", baseHref)
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="${baseHref}">
  <title>${title}</title>
  ${this.#styleLinks()}
  <style>${this.#basePrintCss()}</style>
  ${this.#userStyleTag()}
</head>
<body>
  <main class="qjpc-print-document">
    ${this.#bodyContent()}
  </main>
</body>
</html>`; */
  }

  // Functions to build the print document

  #styleLinks() {

    // Grab all active stylesheet links currently loaded in Foundry
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

    return links
      .map(link => {
        const href = link.getAttribute("href");
        return `<link rel="stylesheet" href="${escapeHtml(href)}">`;
      })
      .join("\n  ");

    //const urls = this.pluginSettings.cssUrls ?? this.pluginSettings.cssFiles ?? [];
    //const urlList = Array.isArray(urls) ? urls : [urls];
    //console.log("QJPC: urllist ", urlList)
    //return urlList
    // .filter(Boolean)
    // .map(url => `<link rel="stylesheet" href="${escapeHtml(url)}">`)
    // .join("\n  ");
  }

  #basePrintCss() {
    return `
@page {
  margin: 15mm;
}

/* ==========================================================================
   1. SCREEN PREVIEW RESETS (Brings back your scrollbars)
   ========================================================================== */
html,
body {
  background: #ffffff;
  color: #111111;
  /* Force the main iframe boundaries to allow natural browser scrolling */
  overflow-y: auto !important;
  overflow-x: auto !important;
  height: 100% !important;
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11pt;
  line-height: 1.45;
}

/* Smash Foundry's app layouts back into standard article blocks for preview */
.journal-entry-pages,
.journal-entry-page,
.prose,
.qjpc-print-document {
  display: block !important;
  height: auto !important;
  min-height: auto !important;
  overflow: visible !important;
  position: relative !important;
}

.qjpc-print-document {
  box-sizing: border-box;
  width: 100%;
  max-width: 190mm;
  margin: 0 auto;
  padding: 12mm;
}

.qjpc-print-plain {
  margin: 0;
  white-space: pre-wrap;
  font-family: Arial, Helvetica, sans-serif;
}

/* Basic Asset Rules */
img, svg, canvas, video {
  max-width: 100%;
  height: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  display: table-header-group;
}

/* ==========================================================================
   2. PRINT ENGINE RESETS (Fixes the 1-page cutoff bug)
   ========================================================================== */
@media print {
  /* Kill ALL height restrictions, absolute positions, and flex properties */
  html, 
  body, 
  .journal-entry-pages, 
  .journal-entry-page, 
  .prose, 
  .qjpc-print-document {
    position: static !important;
    overflow: visible !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    display: block !important; 
  }

  /* Force colors to print */
  body, .qjpc-print-document {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .qjpc-print-document {
    max-width: none;
    padding: 0;
  }

  /* Clean up tables so they don't break mid-row across pages */
  table { display: table !important; }
  tr { display: table-row !important; break-inside: avoid !important; }
  td, th { display: table-cell !important; }

  img, figure {
    break-inside: avoid !important;
  }

  h1, h2, h3, h4 {
    break-after: avoid !important;
  }
}
`;
  }

  #basePrintCssB() {
    return `
@page {
  margin: 15mm;
}

/* 1. OVERRIDE FOUNDRY'S OVERFLOW HIDDEN CLOSURES */
html,
body {
  background: #ffffff;
  color: #111111;
  overflow: auto !important;  /* Forces scrollbars back on for screen preview */
  height: auto !important;    /* Allows the body to expand naturally with content */
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11pt;
  line-height: 1.45;
}

/* 2. LAYOUT CONFIGURATION */
.qjpc-print-document {
  box-sizing: border-box;
  width: 100%;
  max-width: 190mm;
  margin: 0 auto;
  padding: 12mm;
}

.qjpc-print-plain {
  margin: 0;
  white-space: pre-wrap;
  font-family: Arial, Helvetica, sans-serif;
}

/* 3. ASSET HANDLING */
img,
svg,
canvas,
video {
  max-width: 100%;
  height: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  display: table-header-group;
}

/* 4. PRINT SPECIFIC OPTIMIZATIONS */
@media print {
  html, body {
    overflow: visible !important; /* Ensure the print engine sees everything */
  }

  .qjpc-print-document {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    max-width: none;
    padding: 0;
  }

  tr, img, figure {
    break-inside: avoid;
  }

  h1, h2, h3, h4 {
    break-after: avoid;
  }
}
`;
  }

  //TODO: How to get the  styles to
  #basePrintCss2() {
    return `
@page 
{
  margin: 15mm;
}

html,
body {
  background: #ffffff;
  color: #111111;
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11pt;
  line-height: 1.45;
}

.qjpc-print-document {
  box-sizing: border-box;
  width: 100%;
  max-width: 190mm;
  min-height: 100vh;
  margin: 0 auto;
  padding: 12mm;
  background: #0eeb19ff;
  color: #111111;
}

.qjpc-print-plain {
  margin: 0;
  white-space: pre-wrap;
  font-family: Arial, Helvetica, sans-serif;
}

img,
svg,
canvas,
video {
  max-width: 100%;
  height: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  display: table-header-group;
}

tr,
img {
  break-inside: avoid;
}

h1,
h2,
h3,
h4 {
  break-after: avoid;
  }

/*This is the print css*/
@media print {
 .qjpc-print-document {
  -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    max-width: none;
    min-height: auto;
    padding: 0;
    background: blue;
  }
}
`;
  }

  #userStyleTag() {
    const css = cleanStyleText(this.pluginSettings.css);
    //console.log("QJPC: CSS inhalt", css)
    return css ? `<style>${css}</style>` : "";
  }

  #bodyContent() {
    if (this.pluginSettings.isHTML) {
      return this.htmlContent;
    }

    return `<pre class="qjpc-print-plain">${escapeHtml(this.htmlContent)}</pre>`;
  }

}

//========= Generic functions
function cleanStyleText(value) {
  return String(value ?? "")
    .replace(/<\/?style[^>]*>/gi, "")
    .trim();
}
// HTML character adjustments
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}