import { TurndownService } from "./lib/turndown.js";
import { gfm } from "./lib/turndown-plugin-gfm.js";

let turndownService;

export async function convertHtmlToMarkdown(html) {
//https://deepwiki.com/mixmark-io/turndown/1-overview
// https://github.com/trutohq/turndown-plugin-gfm
//https://unpkg.com/@truto/turndown-plugin-gfm@1.0.2/lib/index.js

//This was adapted and updated to newer version thanks to the code of Farling
//https://github.com/farling42/fvtt-export-markdown/tree/master

/*
//We do not use doc, we only parse the html
//export async function convertHtml(doc, html) {
    // Foundry uses "showdown" rather than "turndown":
    // SHOWDOWN fails to parse tables at all
*/
    if (!turndownService) {
        // Setup Turndown service to use GFM for tables
        // headingStyle: "atx"  <-- use "###" to indicate heading (whereas setext uses === or --- to underline headings)
        turndownService = new TurndownService({
            headingStyle: "atx",
            codeBlockStyle: "fenced",
            bulletListMarker: "-"
        });
        // GFM provides supports for strikethrough, tables, taskListItems, highlightedCodeBlock
        //gfm = TurndownPluginGfmService.gfm;
        
        //We imported gfm directly as we use a slightly different plugin
        turndownService.use(gfm);
    }
    let markdown;
    try {

    	//We do not convert links as we only export single pages or journals
    	//also secrets have been allready handled in the DOM manipulation and are allready removed in the html

    	/*
        // Convert links BEFORE doing HTML->MARKDOWN (to get links inside tables working properly)
        // The conversion "escapes" the "[[...]]" markers, so we have to remove those markers afterwards
       
        //const part1 = convertLinks(html, doc)
        //const include_gm = game.settings.get(MOD_CONFIG.MODULE_NAME, MOD_CONFIG.OPTION_INCLUDE_GM_ONLY);
        //const part2 = await foundry.applications.ux.TextEditor.implementation.enrichHTML(part1, { secrets: include_gm });
        //markdown = turndownService.turndown(part2).replaceAll("\\[\\[", "[[").replaceAll("\\]\\]", "]]");
    	*/

        markdown = turndownService.turndown(html).replaceAll("\\[\\[", "[[").replaceAll("\\]\\]", "]]");

        /*
        // Now convert file references: inside a table it will be "\_" rather than just "/"
        //const filepattern = /!\[\]\(([^)]*)\)/g;
        //markdown = markdown.replaceAll(filepattern, replaceLinkedFile);
    	*/

    } catch (error) {
        console.warn(`Error: failed to decode html:`, html)
    }
    return markdown;
}