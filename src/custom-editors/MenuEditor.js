const vscode = require('vscode');
//const CustomEditorBase = require('../CustomEditorBase');
const SiteConfigEditor = require('../SiteConfigEditor');
const { HtmlFrame } = require('../html');
const { RootValue } = require('../htmlDataElements');


class MenuEditor extends SiteConfigEditor {

	constructor(context, document, webviewPanel, token) {
	  super(context, document, webviewPanel, 'MenuEditorViews', '../config/navigation-schema.json', token)
  }

	_renderHtml() {
		const html = new HtmlFrame('Test Nummer 2');
		
		html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'jsonview.css')));
		html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'MenuEditor.css')));
		html.head.scripts.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','js', 'jsonview.js')));
		html.head.scripts.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','js', 'MenuEditor.js')));

		//html.body.children.push(new PlainText(this.document.getText()));
		html.body.children.push(new RootValue(this.json));

		this.view.html = html.toString();
	}

}

module.exports = MenuEditor;