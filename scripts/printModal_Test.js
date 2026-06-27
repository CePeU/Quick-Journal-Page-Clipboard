// Destructure ApplicationV2 from the Foundry API

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;


export default class PrintPopup extends ApplicationV2 {

    static DEFAULT_OPTIONS = {
        id: "qjpc-print-popup",
        classes: ["qjpc-print-modal"],
        window: {
            title: "Journal Print",
            icon: "fas fa-print",
            resizable: true,
            minimizable: true
        },
        position: {
            width: Math.min(window.innerWidth * 0.6, 1024 * 0.8),
            height: Math.min(window.innerheight * 0.6, 764 * 0.8)
        },
        actions: {
            cancel: PrintPopup.#onCancel
        }
    };

    /**print: PrintPopup.#onPrint,
     * 1. Generate the HTML string.
     */
    async _renderHTML(context, options) {
        return `
        <html>
        <body>

      <div class="qjpc-print" style=${settings.css}>
        <div>TEST</div>
        <button type="button" class="onPrint">Print</button>
        <button type="button" data-action="onCancel">Cancel</button>
        <button onclick="printOut()">Print2</button>
        </body>
 </html>
    `;
    }

    /*
     </div>
              <script>
            document.getElementById("onPrint").addEventListener("click",function() {
            alert("Button click click clicked");
            });
        
        </script>
        */
    /**
     * 2. Actually insert the generated HTML into the window element's DOM.
     * This satisfies the missing contract causing the root error.
     */
    async _replaceHTML(result, content, options) {
        content.innerHTML = result;
        console.log("QJCP: Conten.InnteHTML ", result)
    }

    _onRender(context, options) {
        super._onRender(context, options);

        // Find the print button within this window's element shell
        const printBtn = this.element.querySelector(".onPrint");
        if (printBtn) {
            printBtn.addEventListener("click", () => {
                //this.windows.focus();
                window.print(); // Opens the native browser print dialog
            });
        }
    }

    static #onPrint(event, target) {
        ui.notifications.info("The Print button inside the popup was clicked!");
        window.print();
    }

    static async #onCancel(event, target) {
        event.preventDefault();
        await this.close();
    }
}