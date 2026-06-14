export const MODULE_ID = "quick-journal-page-clipboard";

export function createSettings(){
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
  default: "plaintext",
  restricted: false
});

  game.settings.register(MODULE_ID, "isSecretObsidianCallout", {
    name: game.i18n.localize("QJPC.settings.isSecretObsidianCallout.name"),
    hint: game.i18n.localize("QJPC.settings.isSecretObsidianCallout.hint"),
    scope: "user",
    config: true,
    type: Boolean,
    default: false,
    restricted: false
  });

    game.settings.register(MODULE_ID, "isDetailsTagObsidianCallout", {
    name: game.i18n.localize("QJPC.settings.isDetailsTagObsidianCallout.name"),
    hint: game.i18n.localize("QJPC.settings.isDetailsTagObsidianCallout.hint"),
    scope: "user",
    config: true,
    type: Boolean,
    default: false,
    restricted: false
  });

  game.settings.register(MODULE_ID, "isBlockQuoteObsidianCallout", {
    name: game.i18n.localize("QJPC.settings.isBlockQuoteObsidianCallout.name"),
    hint: game.i18n.localize("QJPC.settings.isBlockQuoteObsidianCallout.hint"),
    scope: "user",
    config: true,
    type: Boolean,
    default: false,
    restricted: false
  });

    game.settings.register(MODULE_ID, "htmlStyleTag", {
    name: game.i18n.localize("QJPC.settings.htmlStyleTag.name"),
    hint: game.i18n.localize("QJPC.settings.htmlStyleTag.hint"),
    scope: "user",
    config: true,
    type: String,
    default: "",
    restricted: false
  });

  game.settings.register(MODULE_ID, "picturePathSearchFor", {
    name: game.i18n.localize("QJPC.settings.picturePathSearchFor.name"),
    hint: game.i18n.localize("QJPC.settings.picturePathSearchFor.hint"),
    scope: "user",
    config: true,
    type: String,
    default: "",
    restricted: false
  });

    game.settings.register(MODULE_ID, "picturePathReplaceWith", {
    name: game.i18n.localize("QJPC.settings.picturePathReplaceWith.name"),
    hint: game.i18n.localize("QJPC.settings.picturePathReplaceWith.hint"),
    scope: "user",
    config: true,
    type: String,
    default: "",
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
    name: "Callout Types",
    label: "Html Settings",
    hint: "Configure additional HTML export settings.",
    icon: "fas fa-list",
    type: htmlOptions,
    restricted: false
  });
 
}


// Create a Mixin Base class with generalized methods for all derived classes/modals
class SettingsApplicationV2 extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2){
  static SETTINGS = [];

   async _prepareContext() {
    return this.constructor.SETTINGS.reduce((obj, key) => {
      obj[key] = game.settings.get(MODULE_ID, key);
      return obj;
    }, {});
  }

  async _onSubmitForm(formData) {
    for (const key of this.constructor.SETTINGS) {
      if (key in formData) {
        await game.settings.set(MODULE_ID, key, formData[key]);
      }
    }
    this.close();
  }

  async _onCancel() {
    console.log("QJPC: I got the close order")
    this.close();
  }
}

export class MarkdownOptions extends SettingsApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-markdown-options`,
    title: "Markdown Options",
    window: { icon: "fas fa-cog", resizable: true },
    position: { width: 760, height: "auto" }
  };

  static PARTS = {
    form: { template: "modules/quick-journal-page-clipboard/templates/markdown-settings.hbs" }
  };

  static SETTINGS = [
    "isSecretObsidianCallout",
    "isDetailsTagObsidianCallout",
    "isBlockQuoteObsidianCallout",
    "htmlStyleTag"
  ];
}

export class htmlOptions extends SettingsApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-html-options`,
    title: "Html Options",
    window: { icon: "fas fa-cog", resizable: true },
    position: { width: 760, height: "auto" }
  };

  static PARTS = {
    form: { template: "modules/quick-journal-page-clipboard/templates/html-settings.html" }
  };

  static SETTINGS = [
    "picturePathSearchFor",
    "picturePathReplaceWith"
  ];
}

// ...existing code...

export function getSettings(){
    const removeSecretsGlobal = game.settings.get(MODULE_ID, "removeGMSecrets");
    const removeSecretsForGM = game.settings.get(MODULE_ID, "secretsForGM");
    const isLimited = game.settings.get(MODULE_ID, "allowExportForLimitedUserRights");
    const isCuratedText = game.settings.get(MODULE_ID, "isCuratedText");
    const isEmptyLine = game.settings.get(MODULE_ID, "isEmptyLineText");
    const isPageTitle = game.settings.get(MODULE_ID, "isPageTitle");
    const radioButtonFormat = game.settings.get(MODULE_ID, "outputFormat");
    const isRenderNoteCallout = game.settings.get(MODULE_ID, "isDetailsTagObsidianCallout");
    const isRenderSecretCallout = game.settings.get(MODULE_ID, "isSecretObsidianCallout");
    const isRenderInfoCallout = game.settings.get(MODULE_ID, "isBlockQuoteObsidianCallout");
    const styleCSS = game.settings.get(MODULE_ID, "htmlStyleTag") ?? "";
    const searchPathFor = game.settings.get(MODULE_ID, "picturePathSearchFor")  ?? "";
    const replacePathWith =game.settings.get(MODULE_ID, "picturePathReplaceWith")  ?? ""; 


    const isMarkdown = radioButtonFormat === "markdown";
    const isHTML = radioButtonFormat === "html";
    const isCSS = styleCSS.length>0 ? true : false;


    const settings =
    {
    isRemoveSecretsForAllPlayers: removeSecretsGlobal,
    isRemoveSecretsForGM: removeSecretsForGM,
    isUseUserRightsLimited: isLimited,
    isCuratedText: isCuratedText,
    isEmptyLine: isEmptyLine,
    isPageTitle: isPageTitle,
    isMarkdown:isMarkdown,
    isHTML:isHTML,
    isCSS: isCSS,
    css: styleCSS,
    isNoteCallout: isRenderNoteCallout,
    isInfoCallout: isRenderInfoCallout,
    isSecretCallout: isRenderSecretCallout,
    searchForPath: searchPathFor,
    replaceWidthPath: replacePathWith
    }
    
    return settings
}