const vscode = require('vscode');
const Disposables = require('./Disposables');
const {camelCase,resolveJsonHierarchy} = require('./utility');


class CustomEditorBase {
  #context; #document; #panel; #token;
  #disposables = new Disposables();
  
  constructor(context, document, webviewPanel, token) {
    this.#context = context;
    this.#document = document;
    this.#panel = webviewPanel;
    this.#token = token;
    
    this.#panel.webview.options = {
			enableScripts: true,
		};    
  }

  get context() {
    return this.#context;
  }
  get document() {
    return this.#document;
  }
  get json() {
		const text = this.#document.getText();
		if (text.trim().length === 0)
			return {};

		try {
			return JSON.parse(text);
		} catch {
			throw new Error('Could not get json-ata. Content is not valid json');
		}
  }
  set json(value) {
    try {
      const text = JSON.stringify(value, null, 2);
  		const edit = new vscode.WorkspaceEdit();
  		edit.replace(this.#document.uri,
      			       new vscode.Range(0, 0, Infinity, 0),
  			           text);
  		vscode.workspace.applyEdit(edit);
    }
    catch {
			throw new Error('Could not serialize object. Content is not valid json');
    }
  }
  get panel() {
    return this.#panel;
  }
  get view() {
    return this.#panel.webview;
  }
  set disposable(obj) {
    return this.#disposables.push(obj);
  }
  
  replaceJson(path, newValue) {
    const json = this.json;
    const nodes = resolveJsonHierarchy(path,json);
    const last = nodes.length - 1;
    if( nodes[last-1].data != undefined ) {
      nodes[last-1].data[nodes[last].key] = newValue;
      this.json = json;
    }
  }

  #onDispose() {
    this.onDispose();
    this.#disposables.dispose();
    this.#panel = undefined;
  }
  onDispose() {
  }
  
  async renderHtml() {
    this.#panel.webview.html = 'html content';
  }
  async postMessage(type, msg) {
    if( typeof type == 'object' )
      this.#panel.webview.postMessage(type);
    else
      this.#panel.webview.postMessage(Object.assign({},msg,{type}));
  }
  async onDocumentChanged(ev) {
    //this.postMessage({type: 'update', text: this.#document.getText()});
  }
  async onMessage(ev) {
    
  }
  
  initialize() {
    this.renderHtml();
    
    this.disposable = vscode.workspace.onDidChangeTextDocument(ev=>{
			if( ev.document.uri.toString() === this.#document.uri.toString() )
				this.onDocumentChanged(ev);
		});  
		  
		this.#panel.webview.onDidReceiveMessage(ev=>{
		  if( ev.type != undefined ) {
		    const handler = `on${camelCase(ev.type)}Message`;
		    if( typeof this[handler] == 'function' )
		      return this[handler](ev);
		  }
		  return this.onMessage(ev);
		});		

		this.#panel.onDidDispose(()=>this.#onDispose());
  }
} 

module.exports = CustomEditorBase;