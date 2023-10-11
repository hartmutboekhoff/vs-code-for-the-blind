// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
//import * as vscode from 'vscode';
const vscode = require('vscode');
const {loadModules, loadCommands, loadCustomEditors} = require('./Factory/loader.js');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	console.log('Congratulations, your extension "spark-siteconfig-vscode-plugin" is now active!');
	console.log(context);
//	console.log(__filename);
	//console.log(await loadModules('','*.js',true));

  loadCommands(context, 'commands', 'SparkSiteConfig');
  loadCustomEditors(context, 'custom-editors', 'SparkSiteConfig');
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
};
