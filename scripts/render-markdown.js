import { TurndownService } from "./lib/turndown.js";
import { gfm } from "./lib/turndown-plugin-gfm.js";

let turndownService;

export async function convertHtmlToMarkdown(html, calloutSettings) {
    
    // We need to create the objekt each time new because the settings might have changed meanwhile and thus the rules also will change
    //if (!turndownService) {
        turndownService = new TurndownService({
            headingStyle: "atx",
            codeBlockStyle: "fenced",
            bulletListMarker: "-"
        });
        
        turndownService.use(gfm);

        // Rule for details tag callout type
    if(calloutSettings.isRenderNoteCallout){
        turndownService.addRule('obsidianDetailsCallout', {
            filter: 'details',
            replacement: ObsidianNoteCallout 
        });
        }

        // Rule for Blockquote tag
         if(calloutSettings.isRenderInfoCallout){
        turndownService.addRule('obsidianInfoCallout', {
             filter: 'blockquote',
            replacement: ObsidianInfoCallout
        });
    }

        //Rule for section tag callout type which is a secret in Foundry     
        if(calloutSettings.isRenderSecretCallout){
        // Dirty fix so summary tag does not get dropped to soon ...
        // TODO: Try do do it with keep rule in the next iteration
        turndownService.addRule('ignoreSummary', {
            filter: 'summary',
            replacement: () => '' 
        });
        
        turndownService.addRule('obsidianSecretCallout', {
             filter: function (node, options) {
               
                return (node.nodeName === 'SECTION' && node.classList.contains('secret'))
            },

            replacement: ObsidianSecretCallout
        });}
    //} end of if statement for check of Turndown object

    let markdown;
    try {
        markdown = turndownService.turndown(html).replaceAll("\\[\\[", "[[").replaceAll("\\]\\]", "]]");
        //markdown = markdown.replaceAll(/\n\n>\s*\[/g, '\n\n\n> [');
    } catch (error) {
        console.warn(`Error: failed to decode html:`, html, error);
    }
    return markdown;
}

// Function for Turndown rule
function ObsidianNoteCallout(content, node) {
    // Get the title from the summary tag
    const summaryElement = node.querySelector('summary');
    //const title = summaryElement ? summaryElement.textContent.trim() : 'Note';
    const title = summaryElement ? turndownService.turndown(summaryElement).trim() : 'Note';
    
    // Create the DOM element and create a clone
    // Reomove the summary tag so the remainder can be parsed to markdown
    const parser = new DOMParser();
    const doc = parser.parseFromString(node.innerHTML, 'text/html');
    const tempSummary = doc.querySelector('summary');
    if (tempSummary) {
        tempSummary.remove();
    }
    
    // Turndown is a global objekt so we can access it here
    // Parse the remaining detials tag node to Markdown
    const innerContent = turndownService.turndown(doc.body.innerHTML).trim();
    
    // Split the lines and add a ">" in front also empty line need to receive a ">"
    const formattedContent = innerContent
      .split('\n')
      .map(line => line.trim() ? `> ${line}` : '>')
      .join('\n')
      .trimEnd();
      
    // Return the Callout
    return `\n\n> [!note]- ${title}\n${formattedContent}\n\n`;
}

function ObsidianInfoCallout(content, node) {
 
    const parser = new DOMParser();
    const doc = parser.parseFromString(node.innerHTML, 'text/html');
 
    const innerContent = turndownService.turndown(doc.body.innerHTML).trim();
    
    const formattedContent = innerContent
      .split('\n')
      .map(line => line.trim() ? `> ${line}` : '>')
      .join('\n');
      
    const  finalMarkdown = `\n\n> [!info]- Info\n${formattedContent}\n\n`

    return finalMarkdown;
}

function ObsidianSecretCallout(content,node){
    
    //Get the class and find out if it is a revealed or closed secret
    let secretType =""
    if(node.classList.contains('revealed')) {
        secretType="Revealed"
    } else {
        secretType ="Hidden"
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(node.innerHTML, 'text/html');
  
    const innerContent = turndownService.turndown(doc.body.innerHTML).trim();
    const formattedContent = innerContent
      .split('\n')
      .map(line => line.trim() ? `> ${line}` : '>')
      .join('\n');
      

    return `\n\n> [!secret]- ${secretType} Secret\n${formattedContent}\n\n`;

}