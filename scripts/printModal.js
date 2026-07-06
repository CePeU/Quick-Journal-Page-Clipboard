/*
The print modal creates and holds an iframe to separate the print object from the foundry UI
That comes with a few caveats like transfering css of a system correctly (which does not yet work as intended)
Also giving the user access to adjust css opens up the ability to mess things up.
But .. no risk no fun.
I need to play around with this more. Maybe it is not the best solution.
*/

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

  updateContent(newHtml, newSettings) {
    this.htmlContent = newHtml ?? "";
    this.pluginSettings = newSettings ?? {};

    // Force ApplicationV2 to recalculate _renderHTML and rebuild the iframe srcdoc
    this.render({ force: true });
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
    // the classes are added but css is not yet working satisfactory on this
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
  <main class="qjpc-print-document journal-entry-pages journal-entry-page">
    ${this.#bodyContent()}
  </main>
</body>
</html>`;
  }

  // Functions to build the print document

  #styleLinks() {
    return ""
    //Keeping it for now as a reminder for additional css informations passed as links/paths
  }


  #basePrintCss() {
    /*Class structure
  qjpc-print-modal
  qjpc-print-preview-Shell
  qjpc-print-preview-frame
  qjpc-print-document
    */
    return `
@page {
  margin: 5mm;
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11pt;
  line-height: 1.45;
  overflow: auto !important;
  height: 100% !important;
  width: 100% !important;
}

.qjpc-print-document {
  /*includes padding and border into the content box*/
  box-sizing: border-box;
  width: 100%;
  margin: 0 auto;
  padding: 5mm;
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
   Print settings
   ========================================================================== */
@media print {
 
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

  /* Force colors to print --> This is probably the most important part*/
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

  img {
    break-inside: avoid !important;
  }

  h1, h2, h3, h4, h5, h6 {
    break-after: avoid !important;
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