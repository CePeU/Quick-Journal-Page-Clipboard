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
    position: { width: Math.min(window.innerWidth * 0.6, 1000), height: Math.min(window.innerHeight * 0.8, window.innerHeight * 0.8) }
  };
//console.log("QJPC: Promise before")
  #previewReady = Promise.resolve();
//console.log("QJPC: Promise after")
  /**
   * @param {string} htmlContent - Base HTML content or raw data string.
   * @param {object} pluginSettings - Plugin's configuration state/settings.
   * @param {object} [foundryOptions={}] - Optional standard Foundry window overrides.
   */
  constructor(htmlContent, settings, foundryOptions = {}) {
    // 1. Pass the standard window options up to ApplicationV2
    super(foundryOptions);

    // 2. Store your custom data and settings straight onto the instance
    this.htmlContent = htmlContent ?? "";
    this.pluginSettings = settings ?? {};
  }

  /**
   * Use stored pluginSettings to determine the HTML output logic
   */
  async _renderHTML(context, options) {
console.log("QJPC: render HTML")
    const title = game.i18n.localize("QJPC.windows.printPreview");
    const printLabel = game.i18n.localize("QJPC.controls.print.label");
    const cancelButton = game.i18n.localize("QJPC.settings.buttons.cancel");

    //Create HTML for iframe
    // TODO: Add a cancel button
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
    console.log("QJPC: Options", options);
    const previewFrame = this.element.querySelector(".qjpc-print-preview-frame"); //get the iframe DOM element
    const printBtn = this.element.querySelector(".qjpc-print-btn");
    const cancelBtn = this.element.querySelector(".qjpc-cancel-btn");

    //If a iframe was found render it including the button element
    if (previewFrame) {
      this.#renderPreview(previewFrame, printBtn);
    }

    // add the button to print out the preview iframe
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

  // Load Fonts and images into the iframe and to it just once with disabled print button?
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

  async #printPreviewFrame(previewFrame) {
    if (!previewFrame?.contentWindow) return;

    await this.#previewReady;
    previewFrame.contentWindow.focus();
    previewFrame.contentWindow.print();
  }

  #buildPrintDocument() {
    const title = escapeHtml(game.i18n.localize("QJPC.windows.printPreview"));
    const baseHref = escapeHtml(document.baseURI || window.location.href);
console.log("QJPC: Baseref ",baseHref)
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
</html>`;
  }

  // Functions to build the print document

  #styleLinks() {
    const urls = this.pluginSettings.cssUrls ?? this.pluginSettings.cssFiles ?? [];
    const urlList = Array.isArray(urls) ? urls : [urls];
console.log("QJPC: urllist ",urlList)
    return urlList
      .filter(Boolean)
      .map(url => `<link rel="stylesheet" href="${escapeHtml(url)}">`)
      .join("\n  ");
  }

  #basePrintCss() {
    return `
@page {
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
  background: #f80b0bff;
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

@media print {
  .qjpc-print-document {
    max-width: none;
    min-height: auto;
    padding: 0;
  }
}
`;
  }

  #userStyleTag() {
    const css = cleanStyleText(this.pluginSettings.css);
    console.log("QJPC: CSS inhalt",css)
    return css ? `<style>${css}</style>` : "";
  }

  #bodyContent() {
    if (this.pluginSettings.isHTML) {
      return this.htmlContent;
    }

    return `<pre class="qjpc-print-plain">${escapeHtml(this.htmlContent)}</pre>`;
  }
  /*
  #printIsolatedContent() {
    // 1. Grab just the HTML content you want to print
    const printableHtml = this.element.querySelector("#print-content").innerHTML;

    // 2. Create a hidden iframe element
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const pri = iframe.contentWindow || iframe.contentDocument;

    // 3. Set up the onload listener BEFORE writing the content.
    // This tells the browser: "Wait until this iframe completely finishes loading its text/styles, THEN open the dialog."
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      // Clean up and remove the iframe from the DOM after the dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };

    // 4. Open, write the text, and close the stream to trigger the 'load' event
    pri.document.open();
    pri.document.write(`
      <html>
        <head>
          <title>Print Document</title>
   
        </head>
        <body>
          ${printableHtml}
        </body>
      </html>
    `);
    pri.document.close(); // Crucial! This tells the browser the HTML string is finished, triggering iframe.onload
  }*/
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