const vscode = require('vscode');
const SiteConfigEditor = require('../SiteConfigEditor');
const { HtmlFrame } = require('../html');
const { RootValue } = require('../htmlDataElements');


class GenericSchemaEditor extends SiteConfigEditor {

	constructor(context, document, webviewPanel, token) {
	  super(context, document, webviewPanel, 'GenericSchemaEditorViews', '../config/schema/schema.schema.json', token);
  }

  initHtml(html) {
    super.initHtml(html);
	  html.head.title = 'GenericSchemaEditor - '+this.document.fileName;
		//html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'MenuEditor.css')));
		//html.head.scripts.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','js', 'MenuEditor.js')));
  }
}

module.exports = GenericSchemaEditor;