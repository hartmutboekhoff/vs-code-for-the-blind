const vscode = require('vscode');
const {$getDiagnosticData: getFactoryDiagnostics} = require('../factory'); 
const { HtmlFrame } = require('../html');
const { RootValue } = require('../htmlDataElements');

function getViewColumn() {
  return vscode.window.activeTextEditor
  			  ? vscode.window.activeTextEditor.viewColumn
  			  : vscode.ViewColumn.One;
}

class FactoryDiagnostics {
  #context; #panel; #isDisposed = false;
  
  constructor(context) {
    this.#context = context;

		this.#panel = vscode.window.createWebviewPanel(
			'SparkSiteConfig.FactoryDiagnostics',
			'Factory Diagnostics',
			getViewColumn(),
			{
    		enableScripts: true,
        enableFindWidget: true,
  	    retainContextWhenHidden: true,
    		localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
    	}
		);
		
		this.#panel.onDidDispose(()=>this.dispose());
		
		this.#panel.webview.title = 'Factory Diagnostics';
		this.#panel.webview.html = 'factory diagnostics.';
    this.renderHtml();
    
  }
  get isDisposed() {
    return this.#isDisposed;
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
  
	renderHtml() {
		const html = new HtmlFrame('Factory Diagnostics');
		
    html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'common.css')));
    html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'jsonview.css')));
		html.head.scripts.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','js', 'jsonview.js')));
		html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'FactoryDiagnostics.css')));
		html.head.scripts.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','js', 'FactoryDiagnostics.js')));

		html.body.children.push(new RootValue(getFactoryDiagnostics(), {excludeKeys:['module']}));

		this.view.html = html.toString();
	}
	dispose() {
	  instance = undefined;
	  this.#isDisposed = true;
	}
}

let instance = undefined;

function openDiagnostics(context) {
  if( instance == undefined || instance.isDisposed )
    instance = new FactoryDiagnostics(context);
  else
    instance.panel.reveal(getViewColumn());
}

module.exports = openDiagnostics;