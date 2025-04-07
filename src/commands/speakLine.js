const vscode = require('vscode');
const narrator = require('../CodeNarrator');

async function speekLine() {
  await narrator.speakLine();
}

module.exports = speekLine;