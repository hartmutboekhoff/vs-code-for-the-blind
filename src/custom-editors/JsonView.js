const vscode = require('vscode');
const JsonEditorBase = require('../JsonEditorBase');
const { HtmlFrame } = require('../html');
const { RootValue } = require('../htmlDataElements');


class ApiFacade extends EventTarget {
  gotoJsonPath(path) {
    if( path == undefined || activeEditor == undefined ) return;
console.log('goting to ', path)    ;
    activeEditor.gotoJsonPath(path);
  }
}

const apiInstance = new ApiFacade();
let activeEditor;

class JsonView extends JsonEditorBase {

	constructor(context, document, webviewPanel, token) {
	  super(context, document, webviewPanel, token);
	  activeEditor = this;

    webviewPanel.onDidChangeViewState(ev=>{
      if( this.panel == ev.webviewPanel ) {
        if( ev.webviewPanel.active )
          activeEditor = this;
        else
          activeEditor = undefined;
      }
    });
  }
  
  gotoJsonPath(path) {
    this.postMessage('gotoJsonPath', {path});
  }

	renderHtml() {
		const html = new HtmlFrame('JSON View - '+this.document.fileName);
		
		html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'common.css')));
		html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'develop.css')));
    //html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'jsonview.css')));
    html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'jsonview2.css')));
		html.head.scripts.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','js', 'jsonview.js')));

		html.body.children.append(new RootValue(this.json));

		this.view.html = html.toString();
	}

}

module.exports = {
  JsonView,
  API: apiInstance,
};