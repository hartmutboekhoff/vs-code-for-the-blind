const vscode = require('vscode');

async function jsonViewGotoPath() {
  const path = await vscode.window.showInputBox({
    placeHolder: 'JSON path'
  });
  vscode.extensions.getExtension('hartmut.boekhoff.vscode-for-the-blind')?.exports?.JsonView?.gotoJsonPath(path);
}

module.exports = jsonViewGotoPath;