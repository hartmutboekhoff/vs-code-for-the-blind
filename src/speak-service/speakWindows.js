const Speak = require('./speak');

class SpeakWindows extends Speak {
  constructor() {
    super();
  }

  get supportsSSML() {
    return true;
  }

  async startSpeaking(text, rate) {
    const isSSML = text.trimStart().startsWith('<speak');

    const speakCall = isSSML
      ? '$synthesizer.SpeakSsml($input)'
      : '$synthesizer.Speak($input)';

    const script = `
        Add-Type -AssemblyName System.Speech;
        $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer;
        $synthesizer.Rate = ${rate / 10};
        $culture = New-Object System.Globalization.CultureInfo("en-US");
        $voices = $synthesizer.GetInstalledVoices($culture);
        if ($voices.Count -gt 0) {
            $synthesizer.SelectVoice($voices[0].VoiceInfo.Name);
        } else {
            $synthesizer.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::NotSet, [System.Speech.Synthesis.VoiceAge]::NotSet, 0, $culture);
        }
        $input = [Console]::In.ReadToEnd();
        ${speakCall};
      `;

    return this.executeCommand('powershell', ['-Command', script], text);
  }
  async stopSpeaking() {
    await this.stop();
  }
}

module.exports = SpeakWindows;
