const vscode = require('vscode');
const Factory = require('../factory/factory.js');


class EditorProviderBase /* implements vscode.CustomTextEditorProvider */ {
  #context;
  
  constructro(context, factoryOptions, jsonSchema) {
    this.#context = context;
    this.#factory = new Factory(factoryname, viewDirectories, selectorCategories);
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

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e=>{
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

}