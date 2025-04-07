const Speak = require('./speak');

class SpeakUnsupportedOS extends Speak {
  constructor() {
    super();
  }  
  
  async startSpeaking(text, rate) {
    throw new Error(`Unsupported platform: ${os.platform()}.`);
  };
  async stopSpeaking() {
    throw new Error(`Unsupported platform: ${os.platform()}.`);
  };
}

module.exports = SpeakUnsupportedOS;