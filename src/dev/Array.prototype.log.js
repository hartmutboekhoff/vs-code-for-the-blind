if( !('log' in Array.prototype) ) {
  Object.defineProperty(Array.prototype,'log',{
    value: function(group) {
      if( group ) console.group(group);
      this.forEach((e,ix)=>console.log(`[${ix}]`, e));
      if( group ) console.groupEnd();
      return this;
    }
  });
}
