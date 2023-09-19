import * as vscode from 'vscode';
import { MenuEditorProvider } from './main/MenuEditor/MenuEditorProvider';

export function activate(context: vscode.ExtensionContext) {

	console.log('spark-siteconfig-editor is now active!');

	let disposable = vscode.commands.registerCommand('spark-siteconfig-editor.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from spark-siteconfig-editor!');
	});

	context.subscriptions.push(disposable);
	
	context.subscriptions.push(MenuEditorProvider.register(context));
	
}

export function deactivate() {}
