const vscode = require('vscode');
const speaker = require('../speak-service');

function stripCodeBlocks(text) {
  return text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '').trim();
}

async function speakClipboard() {
  console.log('[speakClipboard] command triggered');

  // Save current clipboard content before attempting copy
  let rawText = await vscode.env.clipboard.readText();
  console.log('[speakClipboard] saved clipboard length:', rawText?.length ?? 0);

  // Try to copy current selection (works in text editors, fails in webviews)
  try {
    await vscode.commands.executeCommand('editor.action.clipboardCopyAction');
    const freshText = await vscode.env.clipboard.readText();
    if( freshText != "" && freshText != rawText) {
      rawText = freshText;
      console.log('[speakClipboard] fresh copy succeeded:',  'length:', freshText.length);
    }
  } catch (e) {
    console.log('[speakClipboard] fresh copy failed (expected in webviews):', e.message);
  }

  if (!rawText) {
    console.log('[speakClipboard] no text to speak, aborting');
    return;
  }

  const plainText = stripCodeBlocks(rawText);
  console.log('[speakClipboard] after stripping code blocks, length:', plainText.length);

  if (plainText) {
    console.log('[speakClipboard] speaking text:', plainText.substring(0, 200) + (plainText.length > 200 ? '...' : ''));
    await speaker.speak(plainText);
    console.log('[speakClipboard] speech finished');
  } else {  
    console.log('[speakClipboard] speaking text:', rawText.substring(0, 200) + (rawText.length > 200 ? '...' : ''));
    await speaker.speak(rawText);
    console.log('[speakClipboard] speech finished');
  } 
}

module.exports = speakClipboard;
