const vscode = require('vscode');
const cp = require('child_process');

class Speak {
  #isSpeaking = false;
  
  constructor() {
  }

  async executeCommand(command, args, input) {
    return new Promise((resolve, reject) => {
      const child = cp.spawn(command, args);
        
      child.on('error', error=>{
        if( error.message.includes('ENOENT') )
          reject(new Error(`Command not found: ${command}. Please ensure ${command} is installed.`));
        else
          reject(error);
      });
      child.on('exit', code=>{
        if( code === 0 )
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
      await this.stopSpeaking();

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
    if( this.#isSpeaking ) {
      try {
        await this.stopSpeaking();
      }
      catch(error) {
        throw error;
      }
      finally {
        this.#isSpeaking = false;
      }
    }
  }
  async isSpeaking() { 
    return this.#isSpeaking;
  }

  async startSpeaking(text, rate) {
    throw new Error('Implementation is missing. Please override in derived class.');
  };
  async stopSpeaking() {
    throw new Error('Implementation is missing. Please override in derived class.');
  };
}

module.exports = Speak;