//CONFIG.debug.hooks = true
//console.log("QJPC: Module Quick-Journal-Page-Clippboard has started");

import { convertHtmlToMarkdown } from "./render-markdown.js";

let sheetObject = null;

Hooks.once("init", () => {

  
//TODO: restructure trannslations to nested JSON AND to automatic settings translation for name and hint
// new settings setup is possible:
// {Scope}.settings.{SettingSubkey}.Name
// {Scope}.settings.{SettingSubkey}.Hint

/* JSON structure for this 
{
  "quick-journal-page-clipboard": {
    "settings": {
      "returnMDtext": {
        "Name": "Return Markdown Text",
        "Hint": "If enabled, text copied from the journal will maintain its Markdown formatting."
      }
    }
  }
}
*/
// now name and hint can be removed as propperties

game.settings.register("quick-journal-page-clipboard", "removeGMSecrets", {
    name: game.i18n.localize("QJPC.settings.removeGMSecrets.name"),
    hint: game.i18n.localize("QJPC.settings.removeGMSecrets.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    restricted: true
  });

game.settings.register("quick-journal-page-clipboard", "allowExportForLimitedUserRights", {
    name: game.i18n.localize("QJPC.settings.allowLimited.name"),
    hint: game.i18n.localize("QJPC.settings.allowLimited.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    restricted: true
  });

  game.settings.register("quick-journal-page-clipboard", "isCuratedText", {
    name: game.i18n.localize("QJPC.settings.isCuratedText.name"),
    hint: game.i18n.localize("QJPC.settings.isCuratedText.hint"),
    scope: "user",
    config: true,
    type: Boolean,
    default: true,
    restricted: false
  });

  game.settings.register("quick-journal-page-clipboard", "isEmptyLineText", {
    name: game.i18n.localize("QJPC.settings.isEmptyLineText.name"),
    hint: game.i18n.localize("QJPC.settings.isEmptyLineText.hint"),
    scope: "user",
    config: true,
    type: Boolean,
    default: true,
    restricted: false
  });

  game.settings.register("quick-journal-page-clipboard", "isPageTitle", {
    name: game.i18n.localize("QJPC.settings.isPageTitle.name"),
    hint: game.i18n.localize("QJPC.settings.isPageTitle.hint"),
    scope: "user",
    config: true,
    type: Boolean,
    default: false,
    restricted: false
  });

game.settings.register("quick-journal-page-clipboard", "outputFormat", {
  name: game.i18n.localize("QJPC.settings.outputFormat.name"),
  hint: game.i18n.localize("QJPC.settings.outputFormat.hint"),
  scope: "user",
  config: true,
  type: String,
  choices: {
    plaintext: game.i18n.localize("QJPC.settings.plaintext.name"),
    markdown: game.i18n.localize("QJPC.settings.returnMDtext.name"),
    html: game.i18n.localize("QJPC.settings.returnHTMLtext.name")
  },
  default: "plaintext",
  restricted: false
});


  game.keybindings.register("quick-journal-page-clipboard", "showNotification", {
  name: "Copy to clipboard",
  hint: "The keybinding will copy the text of the currently visible page or multipage to the clipboard. Journal/Page needs to be the topmost window.",
  editable: [
    {
      key: "KeyC",
      modifiers: ["Control","Alt"]
    }
  ],
  restricted: false,             // Restrict this Keybinding to gamemaster only?
  onDown: async () => { 

  // Check if a journal sheet is currently open and on TOP (not focused) - this does not allways play any role as sheetObject can be filled allready
  // but it will irritate the user if he can fill the clipboard anyway if no journal is open
    if(!sheetObject) {
    ui.notifications.warn(game.i18n.localize("QJPC.notifications.noJournalOpen"));
    return;
    }
    const isAJournalCurrentlyActive = getAbsoluteTopJournal();
    //console.log("QJPC: top window: ",isAJournalCurrentlyActive)
    
    // Only go on if there is a journal currently opened and on top
    if (!isAJournalCurrentlyActive) {
      ui.notifications.warn(game.i18n.localize("QJPC.notifications.noJournalOpen"));
      return;
    }

    try {
      await getClipboardText(sheetObject);    
    } catch (error) {
      console.error(game.i18n.localize("QJPC.warning.error"), error);
      ui.notifications.error(game.i18n.localize("QJPC.warning.error"));
    }
  },
  //onUp: () => {},
  //reservedModifiers: ["Alt"],  // On ALT, the notification is permanent instead of temporary
  precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
});

console.log("QJPC: Module Quick-Journal-Page-Clippboard has started")
});


//Installs a menue option in the header of Journal entries into the 3 point menue
Hooks.on("getHeaderControlsJournalEntrySheet", (sheet, buttons) => {
  const isJournal = sheet?.document?.documentName ?? "noJournal";

  if(!sheet.document || isJournal!=="JournalEntry") {return;};
  //console.log("qjpc: Sheet: ",sheet)
    sheetObject = sheet; // store the actual sheet into sheetObject to be able to access it with keybinding combination
    const actionName = "textToClipboard";
    buttons.push({
        icon: "fa-solid fa-clipboard",
        label: game.i18n.localize("QJPC.controls.clipboard.label"),
        action: actionName,
        class: "qjpc",
        visible: true,
  
    });


    //if the action does not yet exist create it
    if (!sheet.options.actions[actionName]) {
      
            sheet.options.actions[actionName] = async (event, target) => {
             await getClipboardText(sheet);
    }
    }
});

async function exportJournalText(sheet) {
  const pages = sheet.document.pages.contents ?? []; //contents property/accessor will transform internally a collection into an array
  
  const exportPages = getPagesToExport(sheet,pages); //collects the pages to be exported
 
 if(exportPages.length===0){
  return "";
 } else {
  const parts = [];
  
  const isPageTitle = game.settings.get("quick-journal-page-clipboard", "isPageTitle");
  const radioButtonFormat = game.settings.get("quick-journal-page-clipboard", "outputFormat");
  const isMarkdown = radioButtonFormat === "markdown";
  const isHTML = radioButtonFormat === "html";

  for (const p of exportPages) {
    let text = "";
    //console.log("qjpc: Title: ",p.name)
    if(isPageTitle){
      if(isHTML || isMarkdown){
    text = text + "<h1>" + p.name + "</h1>" + "</br>"+"\n"+"</br>"+"\n";
    } else {
      text = text +  p.name + "\n\n";
    }
    }
    text = text + await extractPlainTextFromPage(p);
    if (text.trim()) {
      parts.push(text.trim());
    }
  }

  return parts.join("\n\n");
  }
}

function getPagesToExport(sheet, activePages) {
    const isMultiple = sheet.isMultiple //check for multi page view
    const isLimited = game.settings.get("quick-journal-page-clipboard", "allowExportForLimitedUserRights")
    const user = game.user; //gets the user currently using this function to check for permissions of pages collected
    // filter all pages which the user cannot see/access which starts from limited level 
    // ==> BUt limited level can be system agnostic so standard is Oberver
    let permissionRoleAllowed = CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
    if(isLimited){
      permissionRoleAllowed = CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED
  };
    let allowedPages = [...activePages].filter((page) =>
      page.testUserPermission(user, permissionRoleAllowed)
    );
    
    let sorted = allowedPages.sort((a, b) => a.sort - b.sort);
    let returnFinalPages = sorted.filter(p => isTextPage(p)) //filter any pages which are not text like PDF and IMAGE

  //console.log ("qjpc: Pages to process: ",returnFinalPages)
  if (isMultiple) {
    return returnFinalPages;
  } else {
    if(isTextPage(sorted[sheet.pageIndex])){
    returnFinalPages = [sorted[sheet.pageIndex]]
    } else {
    ui.notifications.info(game.i18n.localize("QJPC.notifications.unsupported"));
    returnFinalPages = []
    }
    return returnFinalPages; 
    // pageIndex is NOT the index of the array of the pages but the order of the sorted visible(?) pages!
  }
}

function isTextPage(page) {
  const type = page.type ?? "";
  return type === "text" || type === "markdown"; // TODO: check if Foundry markdown has it's own type
}

async function extractPlainTextFromPage(page) {
  // get the html from the page
  const html = page.text?.content ?? "";
  // create a DOM element
  const doc = new DOMParser().parseFromString(html, "text/html");

  // remove all script and style elements - this is not necessary keeping it as reminder
  //doc.querySelectorAll("script, style").forEach(el => el.remove());

    // remove all section tag elements with class "secret" if setting is enabled
  const removeSecrets = game.settings.get("quick-journal-page-clipboard", "removeGMSecrets");
  if (removeSecrets) {
     doc.querySelectorAll("section.secret:not(.revealed)").forEach(el => el.remove());
  }

let resultingText = "";

const radioButtonFormat = game.settings.get("quick-journal-page-clipboard", "outputFormat");
  const isMarkdown = radioButtonFormat === "markdown";
  const isHTML = radioButtonFormat === "html";
const isCuratedText = game.settings.get("quick-journal-page-clipboard", "isCuratedText");
const isEmptyLine = game.settings.get("quick-journal-page-clipboard", "isEmptyLineText");

if (isHTML || isMarkdown) {
    // return the inner HTML as a string
    resultingText = doc.body.innerHTML || "";
  } else {
    if(isCuratedText){
      const text = doc.body.innerText || "";
      resultingText = normalizeText(text);
    } else {
    //textContent should retain "styling" like several spaces but Foundry does again wierd sanitizing so probably useless option
    resultingText = doc.body.textContent || "";
    }

    if(isEmptyLine){
      resultingText = resultingText.replace(/^\s*\n/gm, "");
    }
  }
  return resultingText;
}

function normalizeText(text) {
  return text
    .replace(/\r\n/g, "\n")           // normalize line endings
    //.replace(/^\s*\n/gm, "")          // remove lines that are empty or only whitespace
    .replace(/\n{3,}/g, "\n\n")       // collapse 3+ newlines to 2
    .trim();
}

function getAbsoluteTopJournal() {
  // Gather EVERY open window in Foundry (Legacy + ApplicationV2) - we need this to check for ALL open windows
  const allWindows = [
    ...Object.values(ui.windows), 
    ...foundry.applications.instances.values()
  ];

  // Filter down to only windows that are actively rendered on screen and thus seem active for the user
  const renderedWindows = allWindows.filter(app => app.rendered);

  // If nothing is open at all, exit and return null/nothing
  if (renderedWindows.length === 0) return null;

  //Sort ALL open windows by their DOM z-index (highest first). We grab the DOM because that is what the user really sees
  // Also this will work for APPv1 and APPv2
  //Check if an element is a raw HTML element? If yes, use it directly. If no, grab the first item inside the jQuery wrapper (a.element?.[0])."
  //TODO: Check if that is the best way and state management of v2 is not truly only an internal thing
  const sortedWindows = renderedWindows.sort((a, b) => {
    const elA = a.element instanceof HTMLElement ? a.element : a.element?.[0];
    const elB = b.element instanceof HTMLElement ? b.element : b.element?.[0];

    //Parse the css style for the zIndex
    const zA = elA ? parseInt(window.getComputedStyle(elA).zIndex) || 0 : 0;
    const zB = elB ? parseInt(window.getComputedStyle(elB).zIndex) || 0 : 0;

    return zB - zA; 
  });

  // Inspect the absolute top-most window
  const topWindow = sortedWindows[0];

  // Check if this top-most window is a JournalEntry class which was formerly JournalSheet (for APPv1 only?) 
  // or has a constructorname that includes at least Journal (if it was changed by any other app?/for APPv2
   
  const isTopWindowAJournal = topWindow instanceof JournalEntry || 
                              topWindow.constructor.name.includes("Journal");

                              //foundry.appv1.sheets.JournalSheet

  // Only return the journal if it wins the z-index battle against ALL other apps
  // if isTopWindowAJournal is true we either return the APPv1 or APPv2 object as topWindow. If it is false we return null
  return isTopWindowAJournal ? topWindow : null;
}

  async function getClipboardText(sheet) {
      
      const radioButtonFormat = game.settings.get("quick-journal-page-clipboard", "outputFormat");
      const isMarkdown = radioButtonFormat === "markdown";

      const isEmptyLine = game.settings.get("quick-journal-page-clipboard", "isEmptyLineText");
      let text = await exportJournalText(sheet);
      if(isMarkdown){
        text = await convertHtmlToMarkdown(text);
if(isEmptyLine){
        text = text.replace(/^\s*\n/gm, "");
}
      }
       
      await navigator.clipboard.writeText(text); // browser standard for putting text into the clipboard 
      if(text!==""){ui.notifications.info(game.i18n.localize("QJPC.notifications.copied"));}
  };