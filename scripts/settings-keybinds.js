
export function createKeybinds(settings) {
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

    game.keybindings.register("quick-journal-page-clipboard", "showNotification", {
        name: "Print",
        hint: "The keybinding will print the text of the currently visible page or multipage to the printer. Journal/Page needs to be the topmost window.",
        editable: [
            {
                key: "KeyP",
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

    game.keybindings.register("quick-journal-page-clipboard", "showNotification", {
        name: "Download to File",
        hint: "The keybinding will download the text of the currently visible page or multipage to the filesystem. Journal/Page needs to be the topmost window.",
        editable: [
            {
                key: "KeyF",
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

}