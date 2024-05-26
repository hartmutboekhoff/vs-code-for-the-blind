const vscode = require('vscode');
const Disposables = require('./Disposables');
const {camelCase  ,resolveJsonHierarchy} = require('./utility');
//const {diff:diffJson} = require('./jsonDiff');

const ConfigPath = 'SparkSiteeconfigEditor';

class CustomEditorBase {
  static options = {
    supportsMultipleEditorsPerDocument: true, 
    webviewOptions: {
      enableFindWidget: true,
	    retainContextWhenHidden: true,
      enableScripts: true,
      allowModals: true,
    }
  };

  #context; #document; #panel; #token;
  #disposables = new Disposables();
  #userSettings;
  
  constructor(context, document, webviewPanel, token) {
    this.#userSettings = vscode.workspace.getConfiguration(ConfigPath);
    this.#context = context;
    this.#document = document;
    this.#panel = webviewPanel;
    this.#token = token;
    this.#panel.webview.options = {
      enableScripts: true
    };
		
		this.#panel.onDidDispose(()=>this.#onDispose());

    this.addDisposable(
      vscode.workspace.onDidChangeTextDocument(ev=>{
  			if( ev.document.uri.toString() === this.#document.uri.toString() )
  				this.onDocumentChanged(ev);
		  }),
  		this.view.onDidReceiveMessage(ev=>{
  		  return this.onDidReceiveMessage(ev);
  		}, undefined, this.context.subscriptions)
		);  
  }
  initialize() {
		this.#renderHtml()
  }

  get settings() { 
    return this.#userSettings; 
  }
  get context() {
    return this.#context;
  }
  get panel() {
    return this.#panel;
  }
  get view() {
    return this.#panel.webview;
  }
  get document() {
    return this.#document;
  }
  
  get text() {
    return this.#document.getText();
  }
  set text(value) {
    try {
  		const edit = new vscode.WorkspaceEdit();
  		edit.replace(this.#document.uri,
      			       new vscode.Range(new vscode.Position(0,0), new vscode.Position(this.document.lineCount, 0)), 
      			       value);
  		vscode.workspace.applyEdit(edit);
    }
    catch(e) {
      console.error(e);
			throw new Error('Could not serialize object. Content is not valid json');
    }
  }
  
  #onDispose() {
    this.onDispose();
    this.#disposables.dispose();
    this.#panel = undefined;
  }
  onDispose() {
  }
  addDisposable(...objects) {
    return this.#disposables.push(...objects);
  }
  
  async #renderHtml() {
    try {
      this.renderHtml();
    }
    catch(e) {
      console.error(e);
    }
  }
  renderHtml() {
    this.view.html = 'html content goes here';
  }
  async postMessage(type, msg) {
    if( typeof type == 'object' )
      this.#panel.webview.postMessage(type);
    else
      this.#panel.webview.postMessage(Object.assign({},msg,{type}));
  }
  async onDocumentChanged(ev) {
    //if( this.#differences.length > 0 ) {
    //  this.postMessage('document-changed', {differences:this.#differences});
    //  this.#differences = [];
    //}
    if( ev.contentChanges.length > 0 )
      this.#renderHtml();
    //this.postMessage({type: 'update', text: this.#document.getText()});
  }
  async onDidReceiveMessage(ev) {
	  if( ev.type != undefined ) {
	    const handlerName = `on${camelCase(ev.type)}Message`;
	    if( typeof this[handlerName] == 'function' )
	      return this[handlerName](ev);
	  }
	  return this.onMessage(ev);
  }  
  async onMessage(ev) {
    console.log('some unspecified message', ev);
  }
} 

module.exports = CustomEditorBase;