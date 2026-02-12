const vscode = require('vscode');
const cp = require('child_process');

class Speak {
  #isSpeaking = false;
  #child = null;

  constructor() {
  }

  get supportsSSML() {
    return false;
  }

  async executeCommand(command, args, input) {
    return new Promise((resolve, reject) => {
      const child = cp.spawn(command, args);
      this.#child = child;

      child.on('error', error=>{
        this.#child = null;
        if( error.message.includes('ENOENT') )
          reject(new Error(`Command not found: ${command}. Please ensure ${command} is installed.`));
        else
          reject(error);
      });
      child.on('exit', code=>{
        this.#child = null;
        if( code === 0 || code === null )
          resolve();
        else
          reject(new Error(`Command failed with code ${code}`));
      });

      if( input != undefined ) {
        child.stdin.write(input + '\n');
        child.stdin.end();
      }
    });
  }
  async speak(text, rateFactor=1) {
    rateFactor = rateFactor == undefined? 1
                 : rateFactor <= 0? .5
                 : rateFactor >= 10? 10
                 : rateFactor;

    const workbenchConfig = vscode.workspace.getConfiguration('VsCodeForTheBlind');
    const rate = (workbenchConfig.get('rate') ?? 10) * rateFactor;

    if( this.#isSpeaking )
      await this.stop();

    this.#isSpeaking = true;
    try {
      await this.startSpeaking(text, rate);
    }
    catch(error) {
      throw error;
    }
    finally {
      this.#isSpeaking = false;
    }
  }
  async stop() {
    if( this.#child ) {
      this.#child.kill();
      this.#child = null;
    }
    this.#isSpeaking = false;
  }
  async isSpeaking() {
    return this.#isSpeaking;
  }

  async startSpeaking(text, rate) {
    throw new Error('Implementation is missing. Please override in derived class.');
  };
  async stopSpeaking() {
    this.stop();
  };
}

module.exports = Speak;
