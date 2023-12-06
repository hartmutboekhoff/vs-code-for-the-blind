class GenericCustomEditorProvider {
  #context; #editorClass;
  
	constructor(context, editorClass) {
	  this.#context = context;
	  this.#editorClass = editorClass;
  }

	async resolveCustomTextEditor(document, webviewPanel, token) {
    const editor = new this.#editorClass(this.#context, document, webviewPanel, token);
    editor.initialize?.();
  }
  
  getPanelOptions() {
    let opts  = {};
    let cls = this.#editorClass;
    while( cls != undefined ) {
      opts = Object.assign({}, cls.options, opts);
      cls = Object.getPrototypeOf(cls);
    }
    return opts;
  }
}

module.exports = GenericCustomEditorProvider;