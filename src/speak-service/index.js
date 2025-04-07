const os = require('os');
const SpeakWindows = require('./speakWindows');
const SpeakLinux = require('./speakLinux');
const SpeakMacOS = require('./speakMacOS');
const SpeakUnsupportedOS = require('./speakUnsupportedOS');

function getOsSpeaker() {
  switch( os.platform() ) {
    case 'win32':
      return new SpeakWindows();
    case 'darwin': 
      return new SpeakMacOS();
    case 'linux':
      return new SpeakLinux();
    default:
      return new SpeakUnsupportedOS();
  }
}

module.exports = getOsSpeaker();

