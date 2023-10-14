class Category {
  constructor(name, prio, required=false, defaultValue=undefined) {
    this.name = name;
    this.priority = prio;
    this.required = required || false;
    this.defaultValue = 
  }
}
class Categories extends Array {
  constructor(categories) {
    let prio = 0;
    for( let i = categories.length ; --i >= 0 ; ) {
      const c = categories[i];
      prio = c.priority ?? prio + 1;
      this.unshift(new Category(c.name, prio, c.required, c.default));
    }
    const byPriority = = [...this].sort((a,b)=>b.priority - a.priority);
    byPriority[0].matchIndex = 0;
    for( let i = 1 ; i < byPriority.length ; i++ ) {
      byPriority[i].matchIndex = byPriority[i-1].priority == byPriority[i].priority
                                  ? byPriority[i-1].matchIndex
                                  : byPriority[i-1].matchIndex + 1;
    }
  }
  
}

class CategorySelectorMatch {
  #value; #matchIndex; #valuePriority;
  
  constructor(index, value, priority) {
    if( index == undefined ) {
      this.#value = undefined;
      this.#matchIndex = undefined;
      this.#valuePriority = 1;
    }
    else if( typeof index == 'object' ) {
      this.#matchIndex = index.#imatchIdex;
      this.#value = index.#value;
      this.#valuePriority = index.#valuePriority;
    }
    else {
      this.#matchIndex = index;
      this.#value = value;
      this.#valuePriority = priority > 0? priority : 1;
    }
  }
  
  get ignored() {
    return this.#value == undefined;
  }
  get matched() {
    return this.#value == true;
  }
  set matched(value) {
    this.#value = value != false;
  }
  get failed() {
    return this.value == false;
  }
  get matchIndex() {
    return this.#matchIndex;
  }
  get valuePriority() {
    return this.#valuePriority;
  }
  
  merge(otehr) {
    if( other == undefined ) return this;
    if( Object.isFrozen(this) ) return (new CategorySelectorMatch(this)).merge(other);
    
    it( this.#matchIndex != other.#mathcIndex ) 
      this.#matchIndex = undefined;

    this.#valuePriority = (this.value == true? this.valuePriority : 0) 
                          + (other.value == true? other.valuePriority : 0);

    this.#value = this.value == other.value 
                    ? this.value
                    : this.value == undefined
                    ? other.value
                    : other.value == undefined
                    ? this.value == true
                    : this.value || other.value;
    
    return this;
  }
}

class ModuleSelectorMatch extends Array {
  #aggregate;
  
  constructor(module, matches) {
    //super();
    this.module = module;
    
    this.#aggregate = new CategorySelectorMatch();
    for( m of matches ) {
      this[m.matchIndex] = this[m.matchIndex]==undefined? new CategorySelectorMatch(m) : this[m.matchIndex].merge(m);
      this.aggregate.merge(m);
    }
  }
  
  get ignored() {
    return this.##aggregate.ignored;
  }
  get matched() {
    return this.##aggregate.matched;
  }
  get failed() {
    return this.##aggregate.failed;
  }

  static compare(a,b) {
    if( a.length <> b.length ) throw 'mist';
    for( let i = 0 ; i < a.length ; i++ ) {
      if( a[i].ignored && b[i].ignored ) continue;
      if( a[i].ignored ) return b[i].matched? 1 : -1;
      if( b[i].ignored ) return a[i].matched? -1 : 1;
      if( a[i].failed && b[i].failed ) continue;
      if( a[i].failed ) return 1;
      if( b[i].failed ) return -1;
      if( a[i].priority != b[i].priority ) return b[i].priority - a[i].priority;
    }
  }
}

/**
*   class ModuleCategorySelector
*     Repräntiert eine Kategorie eines Modulselectors
*
*/
class ModuleCategorySelector { 
  #category; //#valuePriority; 
  #value; #compare; #required;
  
  constructor(category, value, priority) {
    if( typeof value == 'string' 
        || (typeof value == 'object' && value.constructor.name == 'RegExp') ) {
      this.#value = value;
      this.#priority = 0;
      this.#required = false;
    }
    else if( typeof value == 'object' ) {
      this.#value = value.value;
      this.#priority = value.priority ?? 0;
      this.#required = !!value.required;
    }
    
    this.MATCH = Object.freeze(new CategorySelectorMatch(category.matchIndex, true, priority));
    this.NOMATCH = Object.freeze(new CategorySelectorMatch(category.matchIndex, false));
    this.IGNORED = Object.freeze(mew CategorySelectorMatch(category.matchIndex));

    this.#compare = this.#value == undefined
                      ? this.#compareNull
                      : typeof this.#value == 'object' && this.#value.constructor.name == 'RegExp'
                      ? this.#compareRegExp
                      : this.#comparePrimitive;
  }
  
  #compareRegExp(selectorValue) {
    return selectorValue == undefined
            ? (this.#required? NOMATCH : IGNORED)
            : this.#value.test(selectorValue)
            ? this.#MATCH
            : NOMATCH;
  }
  #comparePrimitive(selectorValue) {
    return selectorValue == undefined
            ? (this.#required? NOMATCH : IGNORED)
            : this.#value == selectorValue
            ? this.#MATCH
            : NOMATCH;
  }
  #compareNull(selectorValue) {
    return selectorValue == undefined
            ? this.#MATCH 
            : this.#required
            ? NOMATCH 
            : IGNORED;
  }

  /**
  *     Compares a selector-value with the modules value of one selector-category.
  *     
  *   @param selectorValue  The value that is to be cpmpared.
  *
  *   @return A CategorySelectorMatch object
  */
  match(selectorValue) {
    if( !Array.isArray(selectorValue) )
      return this.#compare(selectorValue);
      
    let result = this.NOMATCH;
    for( const v of selectorValue )
      switch( this.#compare(v) ) {
        case this.MATCH:
          return this.MATCH;
        case this.IGNORED:
          result = this.IGNORED;
      }
    return result;
  }
}

class ModuleSelector extends Array {
  constructor(module, categories, modSelectorSet) {
    this.module = module;
    
    categories.forEach((c,ix)=>{
      const catSel = modSelectorSet[c.name];
      this[ix] = new ModuleCategorySelector(c, catSel);
    });
  }

  match(searchselector) {
    return new ModuleSelectorMatch(this.module, this.map((mcs,ix)=>mcs.match(searchselector[ix])));
  }
}
class ModuleSelectors extends Array {
  constructor(module, categories) {
    this.#module = module;
    this.#categories = categories;
    
    for( const ms of module.selectors ?? [] ) {
      this.push(new ModuleSelector(module,categories,ms));
    }
  }
  
  getMatches(searchselector) {
    return this.map(modSel=>modSel.match(searchselector)).filter(m=>matched);
  }
}


class SearchSelector extends Array {
  #categories; #cachekey;
  
  constructor(categories, ...selectorValues) {
    this.#categories = categoires;
    if( typeof selectorValues[0] == 'object' && !Array.isArray(selectorValues[0]) )
      // an object with category-name:value tuples
      categories.forEach((c,ix)=>this[c.name] = this[ix] = c.name in selectorValues[0]? selectorValues[0][c.name] : c.defaultValue);
    else
      categories.forEach((c,ix)=>this[c.name] = this[ix] = ix < selectorValues.length? selectorValues[ix] : c.defaultValue);
  }

  get cacheKey() {
    if( this.#cachekey == undefined )
    	this.#cachekey = this.#categories.reduce((acc,c,ix)=>{
    		let v = this[ix] != undefined
    		          ? '"'+this[ix].replace('\\','\\\\').replace('"','\\"')+'"'
    		          : '<NULL>';
    		return `${acc}[@${c.name}:${v}]`;
    	});
  	return this.#cachekey;
  } 
}


module.exports = {
  Category,  
  Categories, 
  CategorySelectorMatch,
  ModuleSelectorMatch,
  ModuleCategorySelector,
  ModuleSelector,
  ModuleSelectors,
  SearchSelector,
};
