const speaker = require('../speak-service');

async function stopSpeaking() {
  await speaker.stop();
}

module.exports = stopSpeaking;
