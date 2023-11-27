const vscode = require('vscode');
const Disposables = require('./Disposables');
const {camelCase  ,resolveJsonHierarchy} = require('./utility');
const {diff:diffJson} = require('./jsonDiff');

class CustomEditorBase {
  #context; #document; #panel; #token;
  #disposables = new Disposables();
  #json = {valid:false};
  //#differences = [];
  
  constructor(context, document, webviewPanel, token) {
    this.#context = context;
    this.#document = document;
    this.#panel = webviewPanel;
    this.#token = token;
    this.#panel.webview.options = {
			enableScripts: true,
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
  
  get json() {
    if( this.#json.valid ) return this.#json.data;
    this.#json = this.#getJson();
    if( this.#json.valid == false && this.#json.error != undefined )
      throw this.#json.error;
    return this.#json.data;
  }
  set json(value) {
    //const old = this.#getJson();
    //this.#differences.push(...diffJson(old.valid? old.data : {}, value));

    try {
      this.#json = {valid:false};
      const text = JSON.stringify(value, null, 4);
  		const edit = new vscode.WorkspaceEdit();
  		edit.replace(this.#document.uri,
      			       new vscode.Range(new vscode.Position(0,0), new vscode.Position(this.document.lineCount, 0)), 
      			       text);
  		vscode.workspace.applyEdit(edit);
    }
    catch(e) {
      console.error(e);
			throw new Error('Could not serialize object. Content is not valid json');
    }
  }
  #getJson() {
	  const text = this.#document.getText();
	  if (text.trim().length === 0)
		  return {valid:true,data:{}};

	  try {
			return {valid:true, data:JSON.parse(text)};
		} catch(e) {
		  return {valid:false, error:'Could not get json-ata. Content is not valid json. '+e};
    }
  }
  replaceJson(path, newValue) {
    const json = this.json;
    const nodesCascade = resolveJsonHierarchy(path,json);
    const valueIx = nodesCascade.length-1;
    if( valueIx == 0 ) {
      this.json = newValue;
    }
    else {
      const parentData = nodesCascade[valueIx-1].data;
      if( parentData != undefined ) {
        const valueKey = nodesCascade[valueIx].key;
        parentData[valueKey] = newValue;
        this.json = json;
      }
    }
  }
  resolveJson(path, up=0) {
    const nodes = resolveJsonHierarchy(path, this.json);
    return JSON.parse(JSON.stringify(nodes[nodes.length-1-up]?.data));
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