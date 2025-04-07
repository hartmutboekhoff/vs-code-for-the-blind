const vscode = require('vscode');
const narrator = require('../CodeNarrator');

async function speekWord() {
  await narrator.speakWord();
}

module.exports = speekWord;