class Disposables {
  #disposables = [];
  
  dispose() {
    let d;
    while( this.#disposables.length > 0 ) {
      d = this.#disposables.shift();
      if( typeof d?.dispose == 'function' ) {
        try {
          d.dispose();
        }
        catch(e) {
          console.warn(`Failed to dispose object of type ${Object.getPrototypeOf(d)?.constructor?.name ?? 'object'}`, e);
        }
      }
        
    }
  }
  push(...d) {
    this.#disposables.push(...d);
    return d;
  }
  add(...d) {
    return this.push(...d);
  }
}

module.exports = Disposables;
