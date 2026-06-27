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

  /**
   * @param {string} htmlContent - Base HTML content or raw data string.
   * @param {object} pluginSettings - Your plugin's configuration state/settings.
   * @param {object} [foundryOptions={}] - Optional standard Foundry window overrides.
   */
  constructor(htmlContent, settings, foundryOptions = {}) {
    // 1. Pass the standard window options up to ApplicationV2
    super(foundryOptions);

    // 2. Store your custom data and settings straight onto the instance
    this.htmlContent = htmlContent;
    this.pluginSettings = settings;
    //this.windowTitle = game.i18n.localize("QJPC.windows.printPreview");
  }

  /**
   * Use your stored pluginSettings to determine the HTML output logic
   */
  async _renderHTML(context, options) {
    // Access your plugin settings via 'this.pluginSettings'
    let outputHtml = "Nothing to print"
    if (!this.pluginSettings.isFooter & !this.pluginSettings.isHeader) {
      outputHtml = ""
      outputHtml += `
      <div class="scroll-container" style="height: calc(100% - 60px); overflow-y: auto; padding: 15px;">
      <div id="print-content">
        ${this.htmlContent}
        </div>
    </div>
    
    <div class="print-button" style="padding: 10px 15px; height: 60px; border-top: 1px solid #7a7975;">
      <button type="button" class="print-btn">Print Document</button>
    </div>
      `
    }


    /*
        const isCompactMode = true //this.pluginSettings.compactMode === true;
        const showHeader = false //this.pluginSettings.showHeader !== false;
        const theme = "light"//this.pluginSettings.theme || "light";
    
        // Build your HTML dynamically based on those settings
        let outputHtml = `<div class="plugin-wrapper theme-${theme}" style="padding: 15px;">`;
    
        if (showHeader) {
          outputHtml += `<header><h2>Plugin Report</h2></header>`;
        }
    
        if (isCompactMode) {
          outputHtml += `<div class="compact-view">${this.htmlContent}</div>`;
        } else {
          outputHtml += `
            <div class="detailed-view" style="margin-top: 10px; border: 1px solid #ccc; padding: 10px;">
              <h3>Detailed Content</h3>
              ${this.htmlContent}
            </div>
          `;
        }*/

    /*
  outputHtml += `
      <hr>
      <button type="button" class="print-btn">Print Document</button>
    </div>
  `;*/

    return outputHtml;
  }

  async _replaceHTML(result, content, options) {
    content.innerHTML = result;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const printBtn = this.element.querySelector(".print-btn");
    if (printBtn) {
      printBtn.addEventListener("click", () => this.#printIsolatedContent());
    }
  }

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
          <style>
            body { 
              font-family: Arial, sans-serif; 
              color: #000000 !important; 
              background: #ffffff !important; 
              margin: 20px; 
            }
          </style>
        </head>
        <body>
          ${printableHtml}
        </body>
      </html>
    `);
    pri.document.close(); // Crucial! This tells the browser the HTML string is finished, triggering iframe.onload
  }
}