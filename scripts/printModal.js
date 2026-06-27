// PrintPopup.js
const { ApplicationV2 } = foundry.applications.api;

export default class PrintPopup extends ApplicationV2 {

    static DEFAULT_OPTIONS = {
        id: "my-printable-popup",
        window: {
            title: "Printable Document",
            resizable: true
        },
        position: { width: 600, height: 500 }
    };

    async _renderHTML(context, options) {
        return `
      <div id="print-content" style="padding: 20px;">
        <h1>Character Report Sheet</h1>
        <p>This text is completely isolated. Only this block will print.</p>
        <p>Foundry VTT UI components will never leak into this print preview.</p>
      </div>
      <hr>
      <div style="padding: 0 20px 20px 20px;">
        <button type="button" class="print-btn">Print Document</button>
      </div>
    `;
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

    /**
     * Extracts the HTML, drops it into a hidden iframe, and prints it.
     */
    #printIsolatedContent() {
        // 1. Grab just the HTML content you want to print
        const printableHtml = this.element.querySelector("#print-content").innerHTML;

        // 2. Create a hidden iframe element
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "none";

        document.body.appendChild(iframe);

        // 3. Write your HTML content directly into the iframe's document context
        const pri = iframe.contentWindow || iframe.contentDocument;
        pri.document.open();
        pri.document.write(`
      <html>
        <head>
          <title>Print Document</title>
          <style>
            /* Optional: Add custom styling for your printed sheet here */
            body { font-family: sans-serif; color: #333; margin: 20px; }
            h1 { color: #111; border-bottom: 2px solid #000; }
          </style>
        </head>
        <body>
          ${printableHtml}
        </body>
      </html>
    `);
        pri.document.close();

        // 4. Trigger the print dialog specifically on the iframe window
        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        // 5. Clean up and remove the iframe from the DOM after the dialog closes
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    }
}