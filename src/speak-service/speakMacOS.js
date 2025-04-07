const Speak = require('./speak');

const MIN_RATE = 80;
const MAX_RATE = 500;
const DEFAULT_RATE = 175;

class SpeakMacOS extends Speak {
  constructor() {
    super();
  }

  async startSpeaking(text, rate) {
    const adrustedRate = rate < 10
                          ? MIN_RATE + (DEFAULT_RATE-MIN_RATE)*(rate-1)/(10-1)
                          : DEFAULT_RATE + (MAX_RATE-DEAULT_RATE)*(rate-10)*(100-90);

    return this.executeCommand('say', ['-r', Math.floor(adjustedRate).toString(), text]);
  }
  async stopSpeaking() {
    await this.executeCommand('pkill', ['-f', 'say']);
  }
}

module.exports = SpeakMacOS;