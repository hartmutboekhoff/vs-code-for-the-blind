const vscode = require('vscode');
const speaker = require('../speak-service');

function stripCodeBlocks(text) {
  return text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '').trim();
}

async function speakClipboard() {
  console.log('[speakClipboard] command triggered');

  // Save current clipboard content before attempting copy
  const savedClipboard = await vscode.env.clipboard.readText();
  console.log('[speakClipboard] saved clipboard length:', savedClipboard?.length ?? 0);

  // Try to copy current selection (works in text editors, fails in webviews)
  let copiedFresh = false;
  try {
    await vscode.env.clipboard.writeText('');
    await vscode.commands.executeCommand('editor.action.clipboardCopyAction');
    const freshText = await vscode.env.clipboard.readText();
    copiedFresh = freshText.length > 0;
    console.log('[speakClipboard] fresh copy succeeded:', copiedFresh, 'length:', freshText.length);
  } catch (e) {
    console.log('[speakClipboard] fresh copy failed (expected in webviews):', e.message);
  }

  // If fresh copy failed, restore and use the original clipboard content
  if (!copiedFresh) {
    await vscode.env.clipboard.writeText(savedClipboard);
    console.log('[speakClipboard] restored saved clipboard');
  }

  const raw = await vscode.env.clipboard.readText();
  console.log('[speakClipboard] final clipboard length:', raw?.length ?? 0);

  if (!raw) {
    console.log('[speakClipboard] no text to speak, aborting');
    return;
  }

  const text = stripCodeBlocks(raw);
  console.log('[speakClipboard] after stripping code blocks, length:', text.length);

  if (text) {
    console.log('[speakClipboard] speaking text:', text.substring(0, 80) + (text.length > 80 ? '...' : ''));
    await speaker.speak(text);
    console.log('[speakClipboard] speech finished');
  } else {
    console.log('[speakClipboard] text was empty after stripping code blocks');
  }
}

module.exports = speakClipboard;
