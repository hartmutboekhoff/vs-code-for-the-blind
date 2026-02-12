/**
 * SSML markup helpers for Windows System.Speech.Synthesis.
 *
 * System.Speech supports a subset of SSML 1.0:
 * - <speak>, <break>, <emphasis>, <prosody>, <say-as>
 */

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrap(body) {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">${body}</speak>`;
}

function pause(ms) {
  return `<break time="${ms}ms"/>`;
}

function emphasis(text, level = 'moderate') {
  return `<emphasis level="${level}">${escapeXml(text)}</emphasis>`;
}

function prosody(text, { rate, pitch, volume } = {}) {
  const attrs = [];
  if (rate) attrs.push(`rate="${rate}"`);
  if (pitch) attrs.push(`pitch="${pitch}"`);
  if (volume) attrs.push(`volume="${volume}"`);
  if (attrs.length === 0) return escapeXml(text);
  return `<prosody ${attrs.join(' ')}>${escapeXml(text)}</prosody>`;
}

module.exports = { escapeXml, wrap, pause, emphasis, prosody };
