const vscode = require('vscode');

function helloWorld() {
  vscode.window.showInformationMessage('Hallo Welt, Datei wurde geladen!');
}

module.exports = helloWorld;