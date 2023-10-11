class Disposables {
  #disposables = [];
  
  dispose() {
    let d = this.#disposables.shift();
    while( d != undefined ) {
      d.dispose();
      d = this.#disposables.shift();
    }
  }
  push(d) {
    if( d != undefined && typeof d.dispose == 'function' )
      this.#disposables.push(d);
    return d;
  }
  add(d) {
    return this.push(d);
  }
}

module.exports = Disposables;
