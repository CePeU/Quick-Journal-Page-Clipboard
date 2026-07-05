
export const MODULE_ID = "quick-journal-page-clipboard";
export const MODULE_SHORT_ID = "QJPC";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export function createSettings() {

  game.settings.register(MODULE_ID, "outputChannel", {
    name: game.i18n.localize("QJPC.settings.outputChannel.name"),
    hint: game.i18n.localize("QJPC.settings.outputChannel.hint"),
    scope: "user",
    config: true,
    type: String,
    choices: {
      clipboard: game.i18n.localize("QJPC.settings.channelClipboard.name"),
      toFile: game.i18n.localize("QJPC.settings.channelFile.name"),
      toPrinter: game.i18n.localize("QJPC.settings.channelPrint.name")
    },
    default: game.i18n.localize("QJPC.settings.channelClipboard.name"),
    restricted: false
  });

  game.settings.register(MODULE_ID, "fileName", {
    name: game.i18n.localize("QJPC.settings.fileName.name"),
    hint: game.i18n.localize("QJPC.settings.fileName.hint"),
    scope: "user",
    config: true,
    type: String,
    default: "",
    restricted: false
  });

  game.settings.register(MODULE_ID, "removeGMSecrets", {
    name: game.i18n.localize("QJPC.settings.removeGMSecrets.name"),
    hint: game.i18n.localize("QJPC.settings.removeGMSecrets.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    restricted: true
  });

  game.settings.register(MODULE_ID, "secretsForGM", {
    name: game.i18n.localize("QJPC.settings.secretsForGM.name"),
    hint: game.i18n.localize("QJPC.settings.secretsForGM.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    restricted: true
  });

  game.settings.register(MODULE_ID, "allowExportForLimitedUserRights", {
    name: game.i18n.localize("QJPC.settings.allowLimited.name"),
    hint: game.i18n.localize("QJPC.settings.allowLimited.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    restricted: true
  });

  game.settings.register(MODULE_ID, "isCuratedText", {
    name: game.i18n.localize("QJPC.settings.isCuratedText.name"),
    hint: game.i18n.localize("QJPC.settings.isCuratedText.hint"),
    scope: "user",
    config: true,
    type: Boolean,
    default: true,
    restricted: false
  });

  game.settings.register(MODULE_ID, "isEmptyLineText", {
    name: game.i18n.localize("QJPC.settings.isEmptyLineText.name"),
    hint: game.i18n.localize("QJPC.settings.isEmptyLineText.hint"),
    scope: "user",
    config: true,
    type: Boolean,
    default: true,
    restricted: false
  });

  game.settings.register(MODULE_ID, "isPageTitle", {
    name: game.i18n.localize("QJPC.settings.isPageTitle.name"),
    hint: game.i18n.localize("QJPC.settings.isPageTitle.hint"),
    scope: "user",
    config: true,
    type: Boolean,
    default: false,
    restricted: false
  });

  game.settings.register(MODULE_ID, "outputFormat", {
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
    default: game.i18n.localize("QJPC.settings.plaintext.name"),
    restricted: false
  });

  game.settings.register(MODULE_ID, "isSecretObsidianCallout", {
    name: game.i18n.localize("QJPC.settings.isSecretObsidianCallout.name"),
    hint: game.i18n.localize("QJPC.settings.isSecretObsidianCallout.hint"),
    scope: "user",
    config: false,
    type: Boolean,
    default: false,
    restricted: false
  });

  game.settings.register(MODULE_ID, "isDetailsTagObsidianCallout", {
    name: game.i18n.localize("QJPC.settings.isDetailsTagObsidianCallout.name"),
    hint: game.i18n.localize("QJPC.settings.isDetailsTagObsidianCallout.hint"),
    scope: "user",
    config: false,
    type: Boolean,
    default: false,
    restricted: false
  });

  game.settings.register(MODULE_ID, "isBlockQuoteObsidianCallout", {
    name: game.i18n.localize("QJPC.settings.isBlockQuoteObsidianCallout.name"),
    hint: game.i18n.localize("QJPC.settings.isBlockQuoteObsidianCallout.hint"),
    scope: "user",
    config: false,
    type: Boolean,
    default: false,
    restricted: false
  });

  game.settings.register(MODULE_ID, "htmlStyleTag", {
    name: game.i18n.localize("QJPC.settings.htmlStyleTag.name"),
    hint: game.i18n.localize("QJPC.settings.htmlStyleTag.hint"),
    scope: "user",
    config: false,
    type: String,
    default: "",
    restricted: false
  });

  game.settings.register(MODULE_ID, "htmlFooter", {
    name: game.i18n.localize("QJPC.settings.htmlFooter.name"),
    hint: game.i18n.localize("QJPC.settings.htmlFooter.hint"),
    scope: "user",
    config: false,
    type: String,
    default: "",
    restricted: false
  });

  game.settings.register(MODULE_ID, "htmlHeader", {
    name: game.i18n.localize("QJPC.settings.htmlHeader.name"),
    hint: game.i18n.localize("QJPC.settings.htmlHeader.hint"),
    scope: "user",
    config: false,
    type: String,
    default: "",
    restricted: false
  });

  game.settings.register(MODULE_ID, "picturePathSearchFor", {
    name: game.i18n.localize("QJPC.settings.picturePathSearchFor.name"),
    hint: game.i18n.localize("QJPC.settings.picturePathSearchFor.hint"),
    scope: "user",
    config: false,
    type: String,
    default: "",
    restricted: false
  });

  game.settings.register(MODULE_ID, "picturePathReplaceWith", {
    name: game.i18n.localize("QJPC.settings.picturePathReplaceWith.name"),
    hint: game.i18n.localize("QJPC.settings.picturePathReplaceWith.hint"),
    scope: "user",
    config: false,
    type: String,
    default: "",
    restricted: false
  });


  game.settings.register(MODULE_ID, "base64PictureExport", {
    name: game.i18n.localize("QJPC.settings.base64PictureExport.name"),
    hint: game.i18n.localize("QJPC.settings.base64PictureExport.hint"),
    scope: "user",
    config: false,
    type: Boolean,
    default: true,
    restricted: false
  });

  game.settings.registerMenu(MODULE_ID, "markdownSettings", {
    name: "Markdown Settings",
    label: "Markdown Settings",
    hint: "Configure additonal Markdown export settings.",
    icon: "fas fa-list",
    type: MarkdownOptions,
    restricted: false
  });

  game.settings.registerMenu(MODULE_ID, "htmlSettings", {
    name: "HTML Settings",
    label: "Html Settings",
    hint: "Configure additional HTML export settings.",
    icon: "fas fa-list",
    type: HtmlOptions,
    restricted: false
  });

}


// Create a Mixin Base class with generalized methods for all derived classes/modals
// This is overengineered but a good test example
class SettingsApplicationV2 extends HandlebarsApplicationMixin(ApplicationV2) {
  //https://foundryvtt.wiki/en/development/api/applicationv2
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["qjpc-settings"],
    actions: {
      cancel: SettingsApplicationV2.#onCancel,
      setSettings: SettingsApplicationV2.#setSettings
    },
    form: {
      closeOnSubmit: false,
      handler: SettingsApplicationV2.#onSubmit,
      submitOnChange: false
    }
  };



  static SETTINGS = [];
  /*
  The variable-based rendering of handlebars is handled by _prepareContext, an asynchronous function that returns a context object with whatever data gets fed into the template. It has a single argument, options, which is the options object passed to the original render call, but this can usually be ignored.
  In Application V1 terms, this is functionally equivalent to its getData call, with the only functional change that this is always asynchronous.
  Inside your handlebars template, you'll only have access to the data setup in _prepareContext, so if you need to include information such as CONFIG.MYSYSTEM you'll want to include a pointer to it in the returned object.
  */
  async _prepareContext() {
    return this.constructor.SETTINGS.reduce((obj, key) => {
      obj[key] = game.settings.get(MODULE_ID, key);
      //console.log("QJPC: Object for context access in modal: ", obj)
      return obj;
    },
      {}
    );
  }

  static getApplicationFromElement(element) {
    const root = element?.closest?.(".application");
    if (!root) return null;
    return [...foundry.applications.instances.values()].find((app) => app.element === root || app.id === root.id) ?? null;
  }

  static getApplicationFromContext(context, element) {
    if (context instanceof SettingsApplicationV2) return context;
    return SettingsApplicationV2.getApplicationFromElement(element);
  }

  static async #onSubmit(event, form, formData) {

    await this.saveSettings(formData);
    await this.close();
  }

  static async #onCancel(event, target) {
    event.preventDefault();

    const app = SettingsApplicationV2.getApplicationFromContext(this, target);
    await app?.close();
  }

  //TODO: Can be removed but also needs to be removed - keeping it as example for now
  static #setSettings(_event, _target) {
    //console.log("QJPC: Binding to setSettings SUCCESS - event: ", _event)
    //console.log("QJPC: Binding to setSettings SUCESS - target: ", _target)
  }

  async saveSettings(formData) {
    //console.log("QJPC: FormData: ", formData)
    const data = formData.object ?? Object.fromEntries(formData.entries());

    /*
    this.constructor.SETTINGS
this.constructor is a built-in JavaScript property that refers to the constructor function (class) of the current instance. So:

this = the current instance of MarkdownOptions or HtmlOptions
this.constructor = the class itself (MarkdownOptions or HtmlOptions)
this.constructor.SETTINGS = the static SETTINGS array defined on that class
It's equivalent to writing MarkdownOptions.SETTINGS directly, but works for any subclass.
*/

    for (const key of this.constructor.SETTINGS) {
      if (key in data) {
        await game.settings.set(MODULE_ID, key, data[key]);
      }
    }
  }
}

export class MarkdownOptions extends SettingsApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_SHORT_ID}-markdown-options`,
    title: "Markdown Options",
    window: { icon: "fas fa-cog", resizable: true },
    position: { width: Math.min(window.innerWidth * 0.6, 1000), height: "auto" }
  };

  //PARTS defines "property" blocks which are rendered which also can be individually rendered
  //the order of declaration matters as that is the order they are rendered
  //https://foundryvtt.wiki/en/development/api/applicationv2
  static PARTS = {
    form: { template: "modules/quick-journal-page-clipboard/templates/markdown-settings.hbs" }
  };

  static SETTINGS = [
    "isSecretObsidianCallout",
    "isDetailsTagObsidianCallout",
    "isBlockQuoteObsidianCallout"
  ];
}

export class HtmlOptions extends SettingsApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_SHORT_ID}-html-options`,
    title: "HTML Options",
    window: { icon: "fas fa-cog", resizable: true },
    position: { width: Math.min(window.innerWidth * 0.6, 1000), height: "auto" }
  };

  static PARTS = {
    form: { template: "modules/quick-journal-page-clipboard/templates/html-settings.hbs" }
  };

  static SETTINGS = [
    "htmlHeader",
    "htmlStyleTag",
    "base64PictureExport",
    "picturePathSearchFor",
    "picturePathReplaceWith",
    "htmlFooter"
  ];
}

export function getSettings() {
  const removeSecretsGlobal = game.settings.get(MODULE_ID, "removeGMSecrets");
  const removeSecretsForGM = game.settings.get(MODULE_ID, "secretsForGM");
  const isLimited = game.settings.get(MODULE_ID, "allowExportForLimitedUserRights");
  const isCuratedText = game.settings.get(MODULE_ID, "isCuratedText");
  const isEmptyLine = game.settings.get(MODULE_ID, "isEmptyLineText");
  const isPageTitle = game.settings.get(MODULE_ID, "isPageTitle");
  const radioButtonFormat = game.settings.get(MODULE_ID, "outputFormat");
  const radioButtonChannel = game.settings.get(MODULE_ID, "outputChannel");
  const fileName = game.settings.get(MODULE_ID, "fileName");
  const isRenderNoteCallout = game.settings.get(MODULE_ID, "isDetailsTagObsidianCallout");
  const isRenderSecretCallout = game.settings.get(MODULE_ID, "isSecretObsidianCallout");
  const isRenderInfoCallout = game.settings.get(MODULE_ID, "isBlockQuoteObsidianCallout");
  const styleCSS = game.settings.get(MODULE_ID, "htmlStyleTag") ?? "";
  const searchPathFor = game.settings.get(MODULE_ID, "picturePathSearchFor") ?? "";
  const replacePathWith = game.settings.get(MODULE_ID, "picturePathReplaceWith") ?? "";
  const htmlHeader = game.settings.get(MODULE_ID, "htmlHeader") ?? "";
  const htmlFooter = game.settings.get(MODULE_ID, "htmlFooter") ?? "";
  const isBase64Picture = game.settings.get(MODULE_ID, "base64PictureExport");

  const isMarkdown = radioButtonFormat === "markdown";
  const isHTML = radioButtonFormat === "html";
  const isCSS = styleCSS.trim().length > 0 ? true : false;
  const isHeader = htmlHeader.trim().length > 0 ? true : false;
  const isFooter = htmlFooter.trim().length > 0 ? true : false;

  const isToPrinter = radioButtonChannel === "toPrinter";
  const isToFile = radioButtonChannel === "toFile";
  let isClipboard = radioButtonChannel === "clipboard";

  //On first install if no settings have been saved then the dropdown has only false values as none was selected and saved
  //TOD: check if a default can be initialized?
  if (!isClipboard && !isToFile && !isToPrinter) { isClipboard = true }

  const settings =
  {
    isRemoveSecretsForAllPlayers: removeSecretsGlobal,
    isRemoveSecretsForGM: removeSecretsForGM,
    isUseUserRightsLimited: isLimited,
    isCuratedText: isCuratedText,
    isEmptyLine: isEmptyLine,
    isPageTitle: isPageTitle,
    isMarkdown: isMarkdown,
    isHTML: isHTML,
    isCSS: isCSS,
    css: styleCSS,
    isNoteCallout: isRenderNoteCallout,
    isInfoCallout: isRenderInfoCallout,
    isSecretCallout: isRenderSecretCallout,
    searchForPath: searchPathFor,
    replaceWidthPath: replacePathWith,
    isHeader: isHeader,
    isFooter: isFooter,
    footerHTML: htmlFooter,
    headerHTML: htmlHeader,
    isPictureEncode: isBase64Picture,
    isClipboard: isClipboard,
    isToPrinter: isToPrinter,
    isToFile: isToFile,
    fileName: fileName
  }

  return settings
}
