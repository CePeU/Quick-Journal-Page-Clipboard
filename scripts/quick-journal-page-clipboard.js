
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

import { createSettings, getSettings, MODULE_ID } from "./settings.js";
import { convertHtmlToMarkdown } from "./render-markdown.js";
import { convertPageImagesToBase64 } from "./render-html.js";
import PrintPopup from "./printModal.js";

let sheetObject = null;

export function createKeybinds(settings) {
  game.keybindings.register(MODULE_ID, "showNotification", {
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

      // Only go on if there is a journal currently opened and on top
      if (!isAJournalCurrentlyActive) {
        ui.notifications.warn(game.i18n.localize("QJPC.notifications.noJournalOpen"));
        return;
      }

      try {
        await game.settings.set(MODULE_ID, "outputChannel", "clipboard")
        await getClipboardText(sheetObject);
      } catch (error) {
        console.error(game.i18n.localize("QJPC.warning.error"), error);
        ui.notifications.error(game.i18n.localize("QJPC.warning.error"));
      }
    },
    //onUp: () => {}, // Keep as reminder what can be done
    //reservedModifiers: ["Alt"],  // On ALT, the notification is permanent instead of temporary
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });

  game.keybindings.register(MODULE_ID, "print", {
    name: "Print",
    hint: "The keybinding will print the text of the currently visible page or multipage to the printer. Journal/Page needs to be the topmost window.",
    editable: [
      {
        key: "KeyP",
        modifiers: ["Control", "Alt"]
      }
    ],
    restricted: false,
    onDown: async () => {

      if (!sheetObject) {
        ui.notifications.warn(game.i18n.localize("QJPC.notifications.noJournalOpen"));
        return;
      }
      const isAJournalCurrentlyActive = getAbsoluteTopJournal();
      if (!isAJournalCurrentlyActive) {
        ui.notifications.warn(game.i18n.localize("QJPC.notifications.noJournalOpen"));
        return;
      }

      try {
        await game.settings.set(MODULE_ID, "outputChannel", "toPrinter")
        await getClipboardText(sheetObject);
      } catch (error) {
        console.error(game.i18n.localize("QJPC.warning.error"), error);
        ui.notifications.error(game.i18n.localize("QJPC.warning.error"));
      }
    },
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });

  game.keybindings.register(MODULE_ID, "downloadFile", {
    name: "Download to File",
    hint: "The keybinding will download the text of the currently visible page or multipage to the filesystem. Journal/Page needs to be the topmost window.",
    editable: [
      {
        key: "KeyF",
        modifiers: ["Control", "Alt"]
      }
    ],
    restricted: false,
    onDown: async () => {
      if (!sheetObject) {
        ui.notifications.warn(game.i18n.localize("QJPC.notifications.noJournalOpen"));
        return;
      }
      const isAJournalCurrentlyActive = getAbsoluteTopJournal();
      if (!isAJournalCurrentlyActive) {
        ui.notifications.warn(game.i18n.localize("QJPC.notifications.noJournalOpen"));
        return;
      }

      try {
        await game.settings.set(MODULE_ID, "outputChannel", "toFile")
        await getClipboardText(sheetObject);
      } catch (error) {
        console.error(game.i18n.localize("QJPC.warning.error"), error);
        ui.notifications.error(game.i18n.localize("QJPC.warning.error"));
      }
    },
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });

}



Hooks.once("init", () => {

  createSettings()
  const settings = getSettings()
  createKeybinds(settings)

  console.log("QJPC: Module Quick-Journal-Page-Clippboard has started")
});


//Installs a menue option in the header of Journal entries into the 3 point menue
Hooks.on("getHeaderControlsJournalEntrySheet", (sheet, buttons) => {
  const isJournal = sheet?.document?.documentName ?? "noJournal";

  if (!sheet.document || isJournal !== "JournalEntry") { return; };

  sheetObject = sheet; // store the actual sheet into the global sheetObject to be able to access it with keybinding combination
  const actionName = "textToClipboard";

  let settings = getSettings();


  let sufix = " (Text)"
  if (settings.isHTML) {
    sufix = " (HTML)"
  }
  if (settings.isMarkdown) {
    sufix = " (MD)"
  }


  if (settings.isClipboard) {
    buttons.push({
      icon: "fa-solid fa-clipboard",
      label: game.i18n.localize("QJPC.controls.clipboard.label") + sufix,
      action: actionName,
      class: "qjpc",
      visible: true,

    });
  }

  if (settings.isToFile) {
    buttons.push({
      icon: "fa-solid fa-download",
      label: game.i18n.localize("QJPC.controls.saveAs.label") + sufix,
      action: actionName,
      class: "qjpc",
      visible: true,

    });
  }

  if (settings.isToPrinter) {
    buttons.push({
      icon: "fa-solid fa-print",
      label: game.i18n.localize("QJPC.controls.print.label") + sufix,
      action: actionName,
      class: "qjpc",
      visible: true,

    });
  }




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
    //console.log("QJPC: settings ", settings)
    for (const p of exportPages) {
      let text = "";

      //Set a page title for html, markdown and plain text
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

    //Do export HTML kind here depending on export save or print



    return exportText;
  }
}

function getPagesToExport(sheet, activePages) {
  const isMultiple = sheet.isMultiple //check for multi page view
  const settings = getSettings();
  const user = game.user;
  //gets the user currently using this function to check for permissions of pages collected
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
  let returnFinalPages = sorted.filter(p => isTextPage(p)) //filter out any pages which are not text like PDF and IMAGE

  //console.log ("QJPC: Pages to process: ",returnFinalPages)
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
  //console.log("QJPC: Original Object Sheet: ", page)
  let html = page.text?.content ?? "";
  //Foundry saves the HTML in different "formats". Normally it is stripped of line feeds but sometimes it is with line feeds
  //this might be a client/server syncing problem or a problem if HTML is inserted directly and manually either way it needs
  //to be normalized
  const cleaned = html.replace(/[\r\n]+/g, "");
  html = cleaned;
  // create a DOM element
  const doc = new DOMParser().parseFromString(html, "text/html");

  // remove all script and style elements - this is not necessary keeping it as reminder
  //doc.querySelectorAll("script, style").forEach(el => el.remove());

  const settings = getSettings()

  //Secrets will be removed for all unless the user is the GM
  if (settings.isRemoveSecretsForAllPlayers && !game.user.isGM) {
    doc.querySelectorAll("section.secret:not(.revealed)").forEach(el => el.remove());
  }

  //Secrets will be removed for GM unless otherwise stated in settings
  if (game.user.isGM && settings.isRemoveSecretsForGM) {
    doc.querySelectorAll("section.secret:not(.revealed)").forEach(el => el.remove());
  }

  // extract text from html

  let resultingText = "";

  switch (true) {
    case settings.isHTML:
      if (settings.isPictureEncode) {
        await convertPageImagesToBase64(doc)
      } else {
        //TODO: do a isSearchPath setting and isReplacePath
        if (settings.searchForPath.length > 0 && settings.replaceWidthPath.length > 0) {
          //TODO: ASYNC replpace Paths? and await?
          replaceImgSrcPaths(doc, settings.searchForPath, settings.replaceWidthPath)
        }
      }

      //For file export of html AND empty line settings the DOM can be cleaned in advance
      if (settings.isEmptyLine && settings.isToFile) {
        //remove all DOM elements which have an empty innerHTML unless they are on the keep list
        const keepTags = new Set([
          "hr", "img", "input", "meta", "link", "source", "track", "wbr",
          "base", "area", "col", "embed", "param", "table", "tr", "td", "th",
        ]);

        doc.querySelectorAll("*").forEach(el => {
          if (!keepTags.has(el.tagName.toLowerCase()) && el.innerHTML.trim() === "") {
            el.remove();
          }
        });

      }

      resultingText = doc.body.innerHTML || "";
      break;

    case settings.isMarkdown:
      resultingText = doc.body.innerHTML || "";
      break;

    case settings.isCuratedText:
      resultingText = domToPlainText(doc)
      //remove any lines which are empty
      if (settings.isEmptyLine) {
        resultingText = resultingText.replace(/^\s*\n/gm, ""); // remove lines that are empty or only whitespace
      }
      break;

    default:
      //innerText is what the user can actually see on the page (so hidden is not entailed)
      //innerText is affected by css and linebreaks <-- this would be the ideal export format
      //IF the HTML was not saved without line feeds by Foundry
      //so as a default we use textContent
      //everything that is as text in the DOM
      // no css and line breaks

      resultingText = doc.body.textContent ?? ""

      if (settings.isEmptyLine) {
        resultingText = resultingText.replace(/^\s*\n/gm, ""); // remove lines that are empty or only whitespace
      }
      break;
  }
  return resultingText ?? "";
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
  let text = await exportJournalText(sheet);

  if (settings.isMarkdown) {
    text = await convertHtmlToMarkdown(text, settings);//render HTML to markdown and also the callouts
    if (settings.isEmptyLine) {
      text = text.replace(/^\s*\n/gm, "");
      //The following fixes the global deletion of empty lines if a callout afterwards  follows another callout
      const regex = /^(> (?!\[!).+)(\r?\n)(> \[!.+)/gm; //Regex to look for > xxx /n/n and then > [! and put a new line in between
      text = text.replaceAll(regex, '$1$2$2$3'); // This way two Obsidian Callout Blocks stay seperated even if the empty lines have been deleted between them
    }
  }

  //Adjust HTML with Header, Style and Footer

  if (settings.isHTML) {

    if (settings.isToFile) {
      let exportText = ""
      if (settings.isCSS) {
        exportText += "<style>" + settings.css + "</style>"
      }

      if (settings.isHeader) {
        exportText += settings.headerHTML
      }

      exportText += text

      if (settings.isFooter) {
        exportText += settings.footerHTML
      }

      text = exportText
    }



  }

  try {
    if (text !== "") {
      if (settings.isClipboard) {
        await navigator.clipboard.writeText(text);
        ui.notifications.info(game.i18n.localize("QJPC.notifications.copied"))
      }

      if (settings.isToFile) {
        await saveTextToFile(text, settings);
        //TODO: Remove or bind notification to save button
        //ui.notifications.info(game.i18n.localize("QJPC.notifications.fileDownload"));

      }

      if (settings.isToPrinter) {

        const popup = new PrintPopup(text, settings);

        popup.render({ force: true });
        //TODO: Remove or bind notification to print button
        //ui.notifications.info(game.i18n.localize("QJPC.notifications.print"));

      }
    }
  } catch (error) {
    //TODO: localize error message? Is that possible?
    console.error('Output channel could not be opened:', error);
  }
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


async function saveTextToFile(text, settings, fileName) {
  // create the data blob from the text
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });

  //create the suffix
  //TODO: deconstruct suffix and replace with correct suffix for more automation
  let sufix = ".txt"
  if (settings.isHTML) {
    sufix = ".html"
  }
  if (settings.isMarkdown) {
    sufix = ".md"
  }
  fileName = settings.fileName || "clipboard" + sufix;


  // Create an element to trigger the download
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;

  //===  alternative code as a reminder
  //  a.click();
  //  a.remove();
  //URL.revokeObjectURL(url);

  // Dispatch a click event to the element
  // this should be more robust for older browsers/networks than above
  a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  return new Promise(resolve => setTimeout(() => { window.URL.revokeObjectURL(a.href); resolve() }, 100));

}


function domToPlainText(doc) {
  // If a dochument node with .body has been passed then we use the body node
  // else the original node is used
  const node = doc.body ? doc.body.cloneNode(true) : doc.cloneNode(true);

  // Declare tags which are handled like block tags with a LF
  const blockTags = new Set([
    "p", "div", "li", "ul", "ol", "section", "article", "details", "summary",
    "header", "footer", "h1", "h2", "h3", "h4", "h5", "h6"
  ]);

  let exportText = "";

  for (const child of node.childNodes) {

    // 1. Text-Knoten verarbeiten
    if (child.nodeType === Node.TEXT_NODE) {
      // Important: Text-Nodes should not get a  linefeed "\n" in general,
      // because otherwise inline text (like <span>) would get a line feed
      // <p> test1 <span>test2</span> test3 <p> this are for example THREE nodes
      exportText += child.textContent;
      continue;
    }

    // 2. Other NON element token for example comments (there are 12 type of nodes). Element nodes are basic hmtl tags
    if (child.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }

    const tag = child.tagName.toLowerCase();

    // 3. <br> tag are handled directly
    if (tag === "br") {
      exportText += "\n";
      continue;
    }

    const isBlock = blockTags.has(tag);

    // insert a linefedd before block elements! For example if we are in the mids of a line
    if (isBlock && exportText && !exportText.endsWith("\n")) {
      exportText += "\n";
    }

    // recursive call of child nodes aka nested nodes
    const childText = domToPlainText(child);
    exportText += childText;

    // After a block element: If it was a block tag then a linefeed MUST follow.
    // this solves that empty <p></p> have no text but shall trigger a line break as it does in the journal.
    if (isBlock) {
      if (!exportText.endsWith("\n")) {
        exportText += "\n";
      } else if (childText === "" && exportText.endsWith("\n")) {
        // If an element was completly empty AND there was a linefed before that one allready,
        // we trigger a doubpe linefeed
        exportText += "\n";
      }
    }
  }

  return exportText;
}