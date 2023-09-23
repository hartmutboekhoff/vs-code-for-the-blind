const vscode = require('vscode');
const MenuEditorProvider = require('./main/MenuEditor/MenuEditorProvider');


function activate(context) {
	console.log('spark-siteconfig-editor is now active!');

	let disposable = vscode.commands.registerCommand('spark-siteconfig-vscode-plugin.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from spark-siteconfig-editor!\n' + listFiles(context,'').join('<br/>\n'));
	});

	context.subscriptions.push(disposable);
	
	context.subscriptions.push(MenuEditorProvider.register(context));
}

function deactivate() {
}

module.exports = {
  activate, 
  deactivate
};
