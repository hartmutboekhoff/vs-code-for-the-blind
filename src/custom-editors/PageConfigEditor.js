const vscode = require('vscode');
const SiteConfigEditor = require('../SiteConfigEditor');
const { HtmlFrame } = require('../html');
const { RootValue } = require('../htmlDataElements');


class PageConfigEditor extends SiteConfigEditor {

	constructor(context, document, webviewPanel, token) {
	  super(context, document, webviewPanel, 'PageConfigEditorViews', '../config/schema/any-page.schema.json', token);
  }

  initHtml(html) {
    super.initHtml(html);
	  html.head.title = 'MenüEditor - '+this.document.fileName;
		html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'PageConfigEditor.css')));
		html.head.scripts.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','js', 'PageConfigEditor.js')));
  }
}

module.exports = PageConfigEditor;