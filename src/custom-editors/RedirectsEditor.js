const vscode = require('vscode');
//const CustomEditorBase = require('../CustomEditorBase');
const SiteConfigEditor = require('../SiteConfigEditor');
const { HtmlFrame } = require('../html');
const { RootValue } = require('../htmlDataElements');


class RedirectsEditor extends SiteConfigEditor {

	constructor(context, document, webviewPanel, token) {
	  super(context, document, webviewPanel, 'RedirectsEditorViews', '../config/schema/redirects.schema.json', token);
  }

  initHtml(html) {
    super.initHtml(html);
	  html.head.title = 'RedirectsEditor - '+this.document.fileName;
		html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'RedirectsEditor.css')));
		html.head.scripts.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','js', 'RedirectsEditor.js')));
  }
  preprocessJSON(jsonObj) {
    return Object.entries(jsonObj)
      .sort(([a],[b])=>a.localeCompare(b))
      .reduce((acc,[k,v])=>(acc[k]=v,acc),{});
  }
}

module.exports = RedirectsEditor;