const Speak = require('./speak');

class SpeakWindows extends Speak {
  constructor() {
    super();
  }

  async startSpeaking(text, rate) {
    const script = `
        Add-Type -AssemblyName System.Speech;
        $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer;
        $synthesizer.Rate = ${rate /10};
        $culture = New-Object System.Globalization.CultureInfo("en-US");
        $voices = $synthesizer.GetInstalledVoices($culture);
        if ($voices.Count -gt 0) {
            $synthesizer.SelectVoice($voices[0].VoiceInfo.Name);
        } else {
            $synthesizer.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::NotSet, [System.Speech.Synthesis.VoiceAge]::NotSet, 0, $culture);
        }
        $synthesizer.Speak([Console]::In.ReadLine());
      `;

    return this.executeCommand('powershell', ['-Command', script], text);
//        $synthesizer.SelectVoiceByHint(2, 10, 0, "en-US");

  }
  async stopSpeaking() {
    await this.stop();
  }
}

module.exports = SpeakWindows;

/*

Add-Type -AssemblyName System.Speech;
$x = New-Object System.Speech.Synthesis.SpeechSynthesizer;
$x.SpeakAsync('Hello. This is a very very very very long sentence.')
Start-Sleep 1
$x.SpeakAsyncCancelAll()

*/