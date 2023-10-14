const vscode = require('vscode');
const CustomEditorBase = require('../../CustomEditorBase');
const { HtmlFrame, Element, PlainText } = require('../../views/HtmlFrame');



class MenuEditor extends CustomEditorBase {

	constructor(context, document, webviewPanel, token) {
	  super(context, document, webviewPanel, token)
	}

	renderHtml() {
		const html = new HtmlFrame('Test Nummer 2');
		
		// Local path to script and css for the webview
		html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'MenuEditor.js')));
		html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vscode.css')));
		html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'MenuEditor.css')));

		//html.content.children.push(new PlainText(probieren()));
		const h1 = new Element('h1');
		h1.children.push(new PlainText('Test einer Ansicht'));
		html.body.children.push(h1);
		html.body.children.push(new PlainText(this.document.getText()));

		this.view.html = html.toString();
	}

}

module.exports = MenuEditor;