//CONFIG.debug.hooks = true
//console.log("QJPC: Module Quick-Journal-Page-Clippboard has started");

import { convertHtmlToMarkdown } from "./render-markdown.js";
import { createSettings, getSettings } from "./settings.js";
import { imageToBase64, convertPageImagesToBase64 } from "./render-html.js";
import PrintPopup from "./printModal.js";


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
  createSettings()

  game.keybindings.register("quick-journal-page-clipboard", "showNotification", {
    name: "Copy to clipboard",
    hint: "The keybinding will copy the text of the currently visible page or multipage to the clipboard. Journal/Page needs to be the topmost window.",
    editable: [
      {
        key: "KeyC",
        modifiers: ["Control", "Alt"]
      }
    ],
    restricted: false,             // Restrict this Keybinding to gamemaster only?
    onDown: async () => {

      // Check if a journal sheet is currently open and on TOP (not focused) - this does not allways play any role as sheetObject can be filled allready
      // but it will irritate the user if he can fill the clipboard anyway if no journal is open
      if (!sheetObject) {
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

  if (!sheet.document || isJournal !== "JournalEntry") { return; };
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

  const exportPages = getPagesToExport(sheet, pages); //collects the pages to be exported

  if (exportPages.length === 0) {
    return "";
  } else {
    const parts = [];


    const settings = getSettings()
    //const styleCSS = game.settings.get("quick-journal-page-clipboard", "htmlStyleTag");
    //const isPageTitle = game.settings.get("quick-journal-page-clipboard", "isPageTitle");
    //const radioButtonFormat = game.settings.get("quick-journal-page-clipboard", "outputFormat");
    //const isMarkdown = radioButtonFormat === "markdown";
    //const isHTML = radioButtonFormat === "html";

    console.log("QJPC: settings ", settings)
    for (const p of exportPages) {
      let text = "";
      //console.log("qjpc: Title: ",p.name)
      if (settings.isPageTitle) {
        if (settings.isHTML || settings.isMarkdown) {
          text = text + "<h1>" + p.name + "</h1>" + "</br>" + "\n" + "</br>" + "\n";
        } else {
          text = text + p.name + "\n\n";
        }
      }
      text = text + await extractPlainTextFromPage(p);
      if (text.trim()) {
        parts.push(text.trim());
      }
    }

    let exportText = parts.join("\n\n")

    if (settings.isHTML) {
      if (settings.isHeader) {
        exportText = exportText + settings.headerHTML
      }
      if (settings.isCSS) {
        exportText = "<style>" + settings.css + "</style>" + exportText
      }
      if (settings.isFooter) {
        exportText = exportText + settings.footerHTML
      }
    }


    return exportText;
  }
}

function getPagesToExport(sheet, activePages) {
  const isMultiple = sheet.isMultiple //check for multi page view
  const settings = getSettings();
  //const isLimited = game.settings.get("quick-journal-page-clipboard", "allowExportForLimitedUserRights")
  const user = game.user; //gets the user currently using this function to check for permissions of pages collected
  // filter all pages which the user cannot see/access which starts from limited level 
  // ==> BUt limited level can be system agnostic so standard is Oberver
  let permissionRoleAllowed = CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
  if (settings.isLimited) {
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
    if (isTextPage(sorted[sheet.pageIndex])) {
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
  //let removeSecretsGlobal = game.settings.get("quick-journal-page-clipboard", "removeGMSecrets");
  //let removeSecretsForGM = game.settings.get("quick-journal-page-clipboard", "secretsForGM")

  const settings = getSettings()

  //console.log("QJPC: Remove Secret global: ",removeSecretsGlobal)
  // console.log("QJPC: Remove Secret for GM: ",removeSecretsForGM)
  // console.log("QJPC: Is a GM", game.user.isGM)

  //if(!removeSecretsForGM){
  //  console.log("QJPC: GM Secret will be removed: ",removeSecretsForGM)
  //if (removeSecretsGlobal) {
  //  console.log("QJPC: GM Secret will be removed: ",removeSecretsGlobal)
  //   doc.querySelectorAll("section.secret:not(.revealed)").forEach(el => el.remove());
  //  }
  //}

  if (settings.isRemoveSecretsForAllPlayers && !game.user.isGM) {
    //console.log("QJPC:- Secret will be removed for all: ",removeSecretsGlobal)
    doc.querySelectorAll("section.secret:not(.revealed)").forEach(el => el.remove());
  }

  if (game.user.isGM && settings.isRemoveSecretsForGM) {
    //console.log("QJPC:- Secret will be removed for GM: ",removeSecretsGlobal)
    doc.querySelectorAll("section.secret:not(.revealed)").forEach(el => el.remove());
  }

  let resultingText = "";

  //const radioButtonFormat = game.settings.get("quick-journal-page-clipboard", "outputFormat");
  //const isMarkdown = radioButtonFormat === "markdown";
  //const isHTML = radioButtonFormat === "html";
  //const isCuratedText = game.settings.get("quick-journal-page-clipboard", "isCuratedText");
  //const isEmptyLine = game.settings.get("quick-journal-page-clipboard", "isEmptyLineText");

  //const searchPathFor = game.settings.get("quick-journal-page-clipboard", "picturePathSearchFor")  ?? "";
  //const replacePathWith =game.settings.get("quick-journal-page-clipboard", "picturePathReplaceWith")  ?? "";

  switch (true) {
    case settings.isHTML:
      if (settings.isPictureEncode) {
        await convertPageImagesToBase64(doc)
      } else {
        //TODO: do a isSearchPath setting and isReplacePath
        if (settings.searchForPath.length > 0 && settings.replaceWidthPath.length > 0) {
          replaceImgSrcPaths(doc, settings.searchForPath, settings.replaceWidthPath)
        }
      }
      resultingText = doc.body.innerHTML || "";
      break;

    case settings.isMarkdown:
      resultingText = doc.body.innerHTML || "";
      break;

    case settings.isCuratedText:
      resultingText = normalizeText(doc.body.innerText || "");
      if (settings.isEmptyLine) {
        resultingText = resultingText.replace(/^\s*\n/gm, ""); // remove lines that are empty or only whitespace
      }
      break;

    default:
      resultingText = doc.body.textContent || "";
      if (settings.isEmptyLine) {
        resultingText = resultingText.replace(/^\s*\n/gm, ""); // remove lines that are empty or only whitespace
      }
      break;
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

  const settings = getSettings()
  //const calloutSettings = {
  //  isRenderNoteCallout: game.settings.get("quick-journal-page-clipboard", "isDetailsTagObsidianCallout"),
  //  isRenderInfoCallout: game.settings.get("quick-journal-page-clipboard", "isBlockQuoteObsidianCallout"),
  //  isRenderSecretCallout: game.settings.get("quick-journal-page-clipboard", "isSecretObsidianCallout")
  //}


  //const radioButtonFormat = game.settings.get("quick-journal-page-clipboard", "outputFormat");
  //const isMarkdown = radioButtonFormat === "markdown";


  //const isEmptyLine = game.settings.get("quick-journal-page-clipboard", "isEmptyLineText");
  let text = await exportJournalText(sheet);
  if (settings.isMarkdown) {
    text = await convertHtmlToMarkdown(text, settings);//,calloutSettings);
    if (settings.isEmptyLine) {
      text = text.replace(/^\s*\n/gm, "");
      const regex = /^(> (?!\[!).+)(\r?\n)(> \[!.+)/gm; //Regex to look for > xxx /n/n and then > [! and put a new line in between
      text = text.replaceAll(regex, '$1$2$2$3'); // This way two Obsidian Callout Blocks stay seperated even if the empty lines have been deleted between them
    }
  }

  try {
    if (settings.isClipboard) {
      console.log("QST: To Clipboard")
      await navigator.clipboard.writeText(text);
    }

    if (settings.isToFile) {
      console.log("QST: To File")
      //await saveTextToFile(text, settings.fileName || 'output.txt');
      await saveTextToFile(text, settings.fileName || 'd:output.txt');
    }

    if (settings.isToPrinter) {
      //openPrintWindow(text, !!settings.isHTML);
      console.log("QST: To Printer")
      const popup = new PrintPopup();
      popup.render({ force: true });
      //openPrintWindow(text);
    }
  } catch (error) {
    console.error('Output handler failed:', error);
  }

  if (text !== "") { ui.notifications.info(game.i18n.localize("QJPC.notifications.copied")); }
};

function replaceImgSrcPaths(doc, searchForPart, replaceWidthPath) {
  if (!searchForPart) return;
  if (!doc) return;

  const decodeFromUri = (s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };

  const searchPartDecoded = decodeFromUri(searchForPart);

  doc.querySelectorAll("img[src]").forEach(img => {
    const imgSrcPath = img.getAttribute("src") || "";

    const imgSrcPathDecoded = decodeFromUri(imgSrcPath);

    if (imgSrcPathDecoded.includes(searchPartDecoded)) {
      const replacedDecoded = imgSrcPathDecoded.replaceAll(searchPartDecoded, replaceWidthPath);

      try {
        img.setAttribute("src", replacedDecoded);
      } catch {
        img.setAttribute("src", replacedDecoded);
      }
    }
  });

  return doc;
}

/*
if (settings.isClipboard) {
  await navigator.clipboard.writeText(text);
}

if (settings.isToFile) {
  // Check if the browser supports the native File System Save Dialog
  if ('showSaveFilePicker' in window) {
    try {
      const options = {
        suggestedName: 'document.txt',
        types: [{
          description: 'Text Files',
          accept: { 'text/plain': ['.txt'] },
        }],
      };

      // This line opens the official browser "Save As" file dialog box
      const handle = await window.showSaveFilePicker(options);

      // User clicked "OK/Save" -> Write the text content to the selected file
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
    } catch (err) {
      // Handles cases where the user clicks "Cancel" on the dialog box
      if (err.name !== 'AbortError') {
        console.error('File save error:', err);
      }
    }
  } else {
    // FALLBACK: For browsers without showSaveFilePicker support (Safari / Firefox)
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'document.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  }
}*/

/*
function exportChannel() {
  if (settings.isToPrinter) {
    // 1. Open a blank temporary print window
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (printWindow) {
      // 2. Inject only the specific text into the new window's document
      printWindow.document.write(`
      <html>
        <head>
          <title>Print Document</title>
          <style>
            body { font-family: sans-serif; padding: 20px; white-space: pre-wrap; }
          </style>
        </head>
        <body>${text}</body>
      </html>
    `);

      printWindow.document.close(); // Finish loading the content
      printWindow.focus();          // Focus the new window for the user

      // 3. Trigger the print dialog on the sub-window, then close it
      printWindow.print();
      printWindow.close();
    } else {
      alert('Please allow popups to utilize the printing function.');
    }
  }
}*/

async function saveTextToFile(text, fileName) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function openPrintWindow(content, isHTML = false) {
  const printWindow = window.open('', '_top', 'popup=true,width=500,height=700');
  console.log("QJPS: PrintWindow ", printWindow)
  if (!printWindow) return;

  const bodyContent = isHTML ? content : escapeHtml(content).replace(/\n/g, '<br>');

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Print</title>
  <style>
    @page { margin: 20mm; }
    body {
      font-family: Arial, sans-serif;
      font-size: 12pt;
      color: #000;
      margin: 0;
      padding: 20px;
    }
  </style>
</head>
<body>
  ${bodyContent}
  <script>
    window.onload = () => {
      window.focus();
      setTimeout("window.print()", 100);
    };
    //window.onafterprint = () => window.close();
    window.onafterprint = () => window.focus();
  </script>
</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

