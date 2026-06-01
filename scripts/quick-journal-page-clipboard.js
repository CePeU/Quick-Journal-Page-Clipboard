//CONFIG.debug.hooks = true
//console.log("CLI: Module Quick-Journal-Page-Clippboard has started");
Hooks.once("ready", () => {
  game.settings.register("quick-journal-page-clipboard", "removeGMSecrets", {
    name: game.i18n.localize("QJPC.settings.removeGMSecrets.name"),
    hint: game.i18n.localize("QJPC.settings.removeGMSecrets.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    restricted: true
  });

  game.settings.register("quick-journal-page-clipboard", "isCuratedText", {
    name: game.i18n.localize("QJPC.settings.isCuratedText.name"),
    hint: game.i18n.localize("QJPC.settings.isCuratedText.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    restricted: false
  });

  game.settings.register("quick-journal-page-clipboard", "isEmptyLineText", {
    name: game.i18n.localize("QJPC.settings.isEmptyLineText.name"),
    hint: game.i18n.localize("QJPC.settings.isEmptyLineText.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    restricted: false
  });

  game.settings.register("quick-journal-page-clipboard", "isPageTitle", {
    name: game.i18n.localize("QJPC.settings.isPageTitle.name"),
    hint: game.i18n.localize("QJPC.settings.isPageTitle.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    restricted: false
  });

  game.settings.register("quick-journal-page-clipboard", "returnHTMLtext", {
    name: game.i18n.localize("QJPC.settings.returnHTMLtext.name"),
    hint: game.i18n.localize("QJPC.settings.returnHTMLtext.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    restricted: false
  });
});

Hooks.on("getHeaderControlsJournalEntrySheet", (sheet, buttons) => {
  const isJournal = sheet?.document?.documentName ?? "noJournal";

  if(!sheet.document || !isJournal==="JournalEntry") {return;};
  //console.log("qjpc: Sheet: ",sheet)
    
    const actionName = "textToClipboard";
    buttons.push({
        icon: "fa-solid fa-clipboard",
        label: game.i18n.localize("QJPC.controls.clipboard.label"),
        action: actionName,
        class: "qjpc",
        visible: true
    });

    //if the action does not yet exist create it
    if (!sheet.options.actions[actionName]) {
        sheet.options.actions[actionName] = async function(event, target) {
         
      const text = await exportJournalText(sheet);
       
      await navigator.clipboard.writeText(text); // browser standard for putting text into the clipboard 
      if(text!==""){ui.notifications.info(game.i18n.localize("QJPC.notifications.copied"));}
        };
    }
});

async function exportJournalText(sheet) {
  const pages = sheet.document.pages.contents ?? []; //contents will transform internally a collection into an array
  
  const exportPages = getPagesToExport(sheet,pages);
 
 if(exportPages.length===0){
  return "";
 } else {
  const parts = [];
  
  const isPageTitle = game.settings.get("quick-journal-page-clipboard", "isPageTitle");
  const returnHTML = game.settings.get("quick-journal-page-clipboard", "returnHTMLtext");

  for (const p of exportPages) {
    let text = "";
    //console.log("qjpc: Title: ",p.name)
    if(isPageTitle){
      if(returnHTML){
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
    let sorted = [...activePages].sort((a, b) => a.sort - b.sort);
    let returnAllowedPages = sorted.filter(p => isTextPage(p)) //filter any pages which are not text like PDF and IMAGE
   //console.log ("qjpc: Pages to process: ",returnAllowedPages)
  if (isMultiple) {
    return returnAllowedPages;
  } else {
    if(isTextPage(sorted[sheet.pageIndex])){
    returnAllowedPages = [sorted[sheet.pageIndex]]
    } else {
    ui.notifications.info(game.i18n.localize("QJPC.notifications.unsupported"));
    returnAllowedPages = []
    }
    return returnAllowedPages; 
    // pageIndex is NOT the index of the array of the pages but the order of the sorted visible(?) pages!
  }
}

function isTextPage(page) {
  const type = page.type ?? page.documentName ?? "";
  return type === "text" || type === "markdown" || type === "html" || type === "prosemirror";
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
const returnHTML = game.settings.get("quick-journal-page-clipboard", "returnHTMLtext");
const isCuratedText = game.settings.get("quick-journal-page-clipboard", "isCuratedText");
const isEmptyLine = game.settings.get("quick-journal-page-clipboard", "isEmptyLineText");

if (returnHTML) {
    // return the inner HTML as a string
    resultingText = doc.body.innerHTML || "";
  } else {
    if(isCuratedText){
      const text = doc.body.innerText || "";
      resultingText = normalizeText(text);
    } else {
    // get the inner text
    //const text = doc.body.innerText || "";
    //textContent should retain "styling" like several spaces 
    resultingText = doc.body.textContent || "";
    //return normalizeText(text);
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
