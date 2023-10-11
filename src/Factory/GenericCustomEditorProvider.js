class GenericCustomEditorProvider {
  #context; #editorClass;
  
	constructor(context, editorClass) {
	  this.#context = context;
	  this.#editorClass = editorClass;
  }

	async resolveCustomTextEditor(document, webviewPanel, token) {
    const editor = new this.#editorClass(this.#context, document, webviewPanel, token);
    editor.initialize();
  }
}

module.exports = GenericCustomEditorProvider;