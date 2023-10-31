class Category {
  constructor(name, prio, required=false, defaultValue=undefined) {
    this.name = name;
    this.priority = prio;
    this.required = required || false;
    this.defaultValue = defaultValue;
  }
}
class Categories extends Array {
  constructor(categories) {
    super();
    for( let i = 0 ; i < categories.length ; i++ ) {
      const c = categories[i];
      this.push(new Category(c.name, c.priority ?? -i, c.required, c.default));
    }
    const byPriority = [...this].sort((a,b)=>b.priority - a.priority);
    byPriority[0].matchIndex = 0;
    for( let i = 1 ; i < byPriority.length ; i++ ) {
      byPriority[i].matchIndex = byPriority[i-1].priority == byPriority[i].priority
                                  ? byPriority[i-1].matchIndex
                                  : byPriority[i-1].matchIndex + 1;
    }
  }
  
}

class SelectorMatch {
  #value; #matchIndex; #valuePriority;
  
  constructor(index, value, priority) {
    if( index == undefined ) {
      this.#value = undefined;
      this.#matchIndex = undefined;
      this.#valuePriority = 1;
    }
    else if( typeof index == 'object' ) {
      this.#matchIndex = index.#matchIndex;
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
  
  aggregate(other) {
    if( this.#matchIndex != other.#matchIndex ) 
      this.#matchIndex = undefined;

    this.#valuePriority = (this.#value == true? this.#valuePriority : 0) 
                          + (other.#value == true? other.#valuePriority : 0);

    this.#value = this.#value == other.#value 
                    ? this.#value
                    : this.#value == undefined
                    ? other.#value
                    : other.#value == undefined
                    ? this.#value
                    : this.#value && other.#value;
    
    return this;
  }
  toAggregate(other) {
    return (new SelectorMatch(this)).aggregate(other);
  }
  
  toString() {
    return this.#value == true
            ? 'MATCH['+this.#valuePriority+']'
            : this.#value == false
            ? 'NOMATCH'
            : 'IGNORED';
  }
}

class ModuleMatch extends Array {
  #aggregatedValue = new SelectorMatch();
  
  constructor(module, selectorMatches) {
    super();
    this.module = module;
    this.aggregated = this.#aggregatedValue;
    
    for( const m of selectorMatches ) {
      this.#aggregatedValue.aggregate(m);
      if( this[m.matchIndex] == undefined )
        this[m.matchIndex] = new SelectorMatch(m);
      else
        this[m.matchIndex].aggregate(m);
    }
  }
  
  get ignored() {
    return this.#aggregatedValue.ignored;
  }
  get matched() {
    return this.#aggregatedValue.matched;
  }
  get failed() {
    return this.#aggregatedValue.failaggregatedValueed;
  }

  toString() {
    return this.module.$plainName+'='+this.#aggregatedValue.toString()+':{'+[...this].map(s=>s.toString()).join(',')+'}';
  }
  static compare(a,b) {
    if( a.length != b.length ) throw 'mist';
    for( let i = 0 ; i < a.length ; i++ ) {
      if( a[i].ignored && b[i].ignored ) continue;
      if( a[i].ignored ) return b[i].matched? 1 : -1;
      if( b[i].ignored ) return a[i].matched? -1 : 1;
      if( a[i].failed && b[i].failed ) continue;
      if( a[i].failed ) return 1;
      if( b[i].failed ) return -1;
      if( a[i].priority != b[i].priority ) return b[i].priority - a[i].priority;
    }
    return 0;
  }
}

/**
*   class ModuleCategorySelector
*     Repräntiert eine Kategorie eines Modulselectors
*
*/
class ModuleCategorySelector { 
  #category; 
  #value; #priority; #required;
  #compare; 
  
  constructor(category, value) {
    this.#category = category;
    if( value == undefined 
        || typeof value == 'string' 
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
    
    this.MATCH = Object.freeze(new SelectorMatch(category.matchIndex, true, this.#priority));
    this.NOMATCH = Object.freeze(new SelectorMatch(category.matchIndex, false));
    this.IGNORED = Object.freeze(new SelectorMatch(category.matchIndex));

    this.#compare = this.#value == undefined
                      ? this.#compareNull
                      : typeof this.#value == 'object' && this.#value.constructor.name == 'RegExp'
                      ? this.#compareRegExp
                      : this.#comparePrimitive;
  }
  get category() {return this.#category;}
  get value() {return this.#value;}
  get priority() {return this.#priority;}
  get required() {return this.#required;}

  #compareRegExp(selectorValue) {
    return selectorValue == undefined
            ? (this.#required? this.NOMATCH : this.IGNORED)
            : this.#value.test(selectorValue)
            ? this.MATCH
            : this.NOMATCH;
  }
  #comparePrimitive(selectorValue) {
    return selectorValue == undefined
            ? (this.#required? this.NOMATCH : this.IGNORED)
            : this.#value == selectorValue
            ? this.MATCH
            : this.NOMATCH;
  }
  #compareNull(selectorValue) {
    return selectorValue == undefined
            ? this.MATCH 
            : this.#required
            ? this.NOMATCH 
            : this.IGNORED;
  }

  /**
  *     Compares a selector-value with the modules value of one selector-category.
  *     
  *   @param selectorValue  The value that is to be cpmpared.
  *
  *   @return A SelectorMatch object
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
  _compare(selectorValue) {
    const res = this.#compare(selectorValue);
    console.log('comparing', this.#category.name, ': ', this.#value, '==?', selectorValue, ', Result:', res);
    
    return res;
  }
}

class ModuleSelector extends Array {
  #module;
  
  constructor(module, categories, modSelectorSet) {
    super();
    this.module = module;

    categories.forEach((c,ix)=>{
      const catSel = modSelectorSet[c.name];
      this[ix] = new ModuleCategorySelector(c, catSel);
    });
  }

  match(searchselector) {
    return new ModuleMatch(
      this.module, 
      [...this].map((mcs,ix)=>mcs.match(searchselector[ix])))
    ;
  }
  get __module() {
    return this.#module;
  }
  
  toString() {
    return '['+[...this].map(cs=>cs.value).join(',')+']';
  }
}
class ModuleSelectors extends Array {
  constructor(module, categories) {
    super();
    
    for( const ms of module.selectors ?? [] ) {
      this.push(new ModuleSelector(module,categories,ms));
    }
  }
  
  getMatches(searchselector) {
    return [...this]
      .map(modsel=>modsel.match(searchselector))
      .filter(match=>match.matched );
  }
}

class SearchSelector extends Array {
  #categories; #cachekey;
  
  constructor(categories, ...selectorValues) {
    super();
    this.#categories = categories;
    if( typeof selectorValues[0] == 'object' && !Array.isArray(selectorValues[0]) )
      // an object with category-name:value tuples
      categories.forEach((c,ix)=>this[c.name] = this[ix] = c.name in selectorValues[0]? selectorValues[0][c.name] : c.defaultValue);
    else
      categories.forEach((c,ix)=>this[c.name] = this[ix] = ix < selectorValues.length? selectorValues[ix] : c.defaultValue);
  }

  get cacheKey() {
    function escape(s) {
      return s.toString().replace('\\','\\\\').replace('"','\\"');
    }
    function valueToString(v) {
      return v == undefined
    		      ? '<NULL>'
    		      : typeof v == 'string'
    		      ? `"${escape(v)}"`
    		      : Array.isArray(v)
    		      ? '['+v.map(s=>`"${escape(s)}"`).join(',')+']'
    		      : `{"${escape(v.toString())}"}`

    }
    if( this.#cachekey == undefined )
    	this.#cachekey = this.#categories.reduce((acc,c,ix)=>{
    		return `${acc}[@${c.name}:${valueToString(this[ix])}]`;
    	},'');
  	return this.#cachekey;
  } 
  
  toString() {
    return [...this.#categories].map(c=>`${this[c.name]}`).join(',');
  }
}


module.exports = {
  Category,  
  Categories, 
  SelectorMatch,
  ModuleMatch,
  ModuleCategorySelector,
  ModuleSelector,
  ModuleSelectors,
  SearchSelector,
};
