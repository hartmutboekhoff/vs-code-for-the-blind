const vscode = require('vscode');
const narrator = require('../CodeNarrator');

async function speekStatement() {
  await narrator.speakStatement();
}

module.exports = speekStatement;