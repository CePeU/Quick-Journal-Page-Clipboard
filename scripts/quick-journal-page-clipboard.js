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
  for (const p of exportPages) {
    const text = await extractPlainTextFromPage(p);
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

  // remove all script and style elements
  doc.querySelectorAll("script, style").forEach(el => el.remove());

    // remove all section tag elements with class "secret" if setting is enabled
  const removeSecrets = game.settings.get("quick-journal-page-clipboard", "removeGMSecrets");
  if (removeSecrets) {
    doc.querySelectorAll("section.secret").forEach(el => el.remove());
  }


  //get the inner html which should be text
  const text = doc.body.innerText || "";
  return normalizeText(text);
}

function normalizeText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}