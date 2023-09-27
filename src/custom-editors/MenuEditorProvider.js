const vscode = require('vscode');
const { HtmlFrame, PlainText } = require('../views/HtmlFrame');

/**
 * Provider for spark menu editor editors.
 * 
 */
class MenuEditorProvider /*implements vscode.CustomTextEditorProvider*/ {
	#context;

	constructor(context) {
		this.#context = context;
	}
	/**
	 * Called when our custom editor is opened.
	 * 
	 * 
	 */
	async resolveCustomTextEditor(document, webviewPanel, _token) {
		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};
		try {
  		webviewPanel.webview.html = this.#getHtmlForWebview(webviewPanel.webview, document);
	  }
	  catch(e) {
	    console.error(e);
	    webviewPanel.webview.html = e;
	  }

		function updateWebview() {
			webviewPanel.webview.postMessage({
				type: 'update',
				text: document.getText(),
			});
		}

		// Hook up event handlers so that we can synchronize the webview with the text document.
		//
		// The text document acts as our model, so we have to sync change in the document to our
		// editor and sync changes in the editor back to the document.
		// 
		// Remember that a single text document can also be shared between multiple custom
		// editors (this happens for example when you split a custom editor)

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				updateWebview();
			}
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		// Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage(e => {
			switch (e.type) {

			}
		});

		updateWebview();
	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	#getHtmlForWebview(webview, document) {
		const html = new HtmlFrame('Test Nummer 1');
		
		// Local path to script and css for the webview
		html.head.styleSheets.push(webview.asWebviewUri(vscode.Uri.joinPath(this.#context.extensionUri, 'media', 'MenuEditor.js')));
		html.head.styleSheets.push(webview.asWebviewUri(vscode.Uri.joinPath(this.#context.extensionUri, 'media', 'vscode.css')));
		html.head.styleSheets.push(webview.asWebviewUri(vscode.Uri.joinPath(this.#context.extensionUri, 'media', 'MenuEditor.css')));

		//html.content.children.push(new PlainText(probieren()));
		html.body.children.push(new PlainText(document.getText()));

		return html.toString();
	}

	/**
	 * Try to get a current document as json text.
	 */
	#getDocumentAsJson(document) {
		const text = document.getText();
		if (text.trim().length === 0) {
			return {};
		}

		try {
			return JSON.parse(text);
		} catch {
			throw new Error('Could not get document as json. Content is not valid json');
		}
	}

	/**
	 * Write out the json to a given document.
	 */
	#updateTextDocument(document, json) {
		const edit = new vscode.WorkspaceEdit();

		// Just replace the entire document every time for this example extension.
		// A more complete extension should compute minimal edits instead.
		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			JSON.stringify(json, null, 2));

		return vscode.workspace.applyEdit(edit);
	}
}

module.exports = MenuEditorProvider;