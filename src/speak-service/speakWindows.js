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
        $synthesizer.SelectVoiceByHint(1, 30, 0, "en-US");
        $synthesizer.Speak([Console]::In.ReadLine());
      `;

    return this.executeCommand('powershell', ['-Command', script], text);
//        $synthesizer.SelectVoiceByHint(2, 10, 0, "en-US");

  }
  async stopSpeaking() {
    await this.executeCommand('powershell', ['-Command', 'Stop-Speech']);
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