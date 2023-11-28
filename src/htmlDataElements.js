const {Element} = require('./html');
const {getAllPropertyNames} = require('./utility');

function createDataValueElement(name,value, options) {
  try {
    const optsClone = Object.assign({},options)
    if( 'maxDepth' in optsClone )
      --optsClone.maxDepth;
      
    if( value == undefined )
      return new UndefinedValue(name, optsClone);
    else if( Array.isArray(value) )
      return new ArrayValue(name, value, optsClone);
    else if( typeof value == 'object' )
      return new ObjectValue(name, value, optsClone);
    else
      return new PrimitiveValue(name, value, optsClone);
  }
  catch(e) {
    return new Element('div',e.toString(),{'class':'error'});
  }
}

class pre extends Element {
  constructor(content,attributes) {
    super('pre', content, attributes);
  }
}
class TypeName extends Element {
  constructor(value, attributes) {
    let tn = typeof value == 'object'
              ? Object.getPrototypeOf(value).constructor.name
              : typeof value;
             
    super('span', tn, attributes);
    this.classList.add('typename');
    if( Array.isArray(value) ) 
      this.children.append(new Element('span',`(${value.length})`, {class:'array-size'}));
  }
}
class Hint extends Element {
  constructor(text) {
    super('span',text,{class:'hint'});
  }
}
class MaxDepthExceeded extends Element {
  constructor() {
    super('p','Maximum number of nesting levels exceeded', {class:'warning'});
  }
}

class DataElement extends Element {
  constructor(name, options) {
    super('li', undefined, options.attributes);

    this.options = options;
    this.classList.add('data-element');
    this.children.append(new Element('span', name, {'class':'label'}));
  }  
}
class PrimitiveValue extends DataElement {
  constructor(name, value, options) {
    super(name, options);
    this.classList.add('primitive');
    this.classList.add(typeof value);
    this.children.append(new TypeName(value));
    this.children.append(new pre(value));
  }
}
class UndefinedValue extends DataElement {
  constructor(name, options) {
    super(name, options);
    this.classList.add('undefined');
    this.children.append(new pre('undefined',{'class':'undefined'}));
  }
}
class ObjectValue extends DataElement {
  constructor(name, value, options) {
    super(name, options);
    this.classList.add('object');
    this.children.append(new TypeName(value));

    if( options?.maxDepth <= 0 ) {
      this.children.append(new MaxDepthExceeded());
      return;
    }
      
    let keys = getAllPropertyNames(value);
    if( Array.isArray(options.excludeKeys) )
      keys = keys.filter(k=>!options.excludeKeys.includes(k));

    if( keys.length > 0 ) {
    	keys = keys.sort();
      const ul = new Element('ul',{class:'data-element object'});
      for( const k of keys ) {
        const child = createDataValueElement(k, value[k], options);
        ul.children.append(child);
      }    
      this.children.append(ul);
    }
  }
}
class ArrayValue extends DataElement {
  constructor(name, value, options) {
    super(name, options);
    this.classList.add('array');
    this.children.append(new TypeName(value));

    if( options?.maxDepth <= 0 ) {
      this.children.append(new MaxDepthExceeded());
      return;
    }

    if( value.length > 0 ) {
      const ol = new Element('ol',{class:'data-element array', start:0});
      
      for( const n in value ) {
        if( options.excludeKeys?.includes(n) )
          continue;
        
        const childValue = value[n];
        const outputName = Number.isInteger(+n)? `[${n}]` : n;
        const child = createDataValueElement(outputName, childValue, options);
        const hint = childValue.name ?? childValue.label ?? childValue.title ?? childValue.id ?? childValue.key ?? childValue.type ?? (typeof childValue.value != 'object'? childValue.value : undefined);
        if( hint != undefined )
          child.children.insertAt(2, new Hint(hint));
        ol.children.append(child);
      }
      this.children.append(ol);
    }
  }
}
class RootValue extends Element {
  constructor(value, options) {
    super(Array.isArray(value)? 'ol' : 'ul', {class:'data-element root'});

    options ??= {};
    options.maxDepth ??= 10;

    for( const n in value ) {
      const child = createDataValueElement(n,value[n], options);
      this.children.append(child);
    }
  }
}

module.exports = {
  pre,
  UndefinedValue,
  PrimitiveValue,
  ObjectValue,
  ArrayValue,
  RootValue,
}