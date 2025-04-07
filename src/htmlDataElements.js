const {Element} = require('./html');
const {getAllPropertyNames} = require('./utility');

const JsonDefaultMaxDepth = Infinity;
const JsonDefaultOptions = {
  maxDepth: JsonDefaultMaxDepth,
  excludedProperties: ['password'],
  hintProperties: ['name','title','label','id','key', 'description', 'type'],
};

function createDataValueElement(name,value, options) {
  try {
    const optsClone = {...options};
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
    console.error(e);
    return new Element('div',e.toString(),{'class':'error'});
  }
}
function createHint(value, options) {
  if( typeof value != 'object' ) return;

  if( !Array.isArray(value) ) {
    const hintProperty = options.hintProperties?.find(hp=>value[hp]);
    if( hintProperty != undefined )
      return new Hint(value[hintProperty]);
    const len = Object.keys(value).length;
    return new Hint(len==0? '{ empty object }' : len==1? '{ 1 property }' : `{ ${len} properties }`)
  }
  else if( value.length == 0 ) {
    return new Hint('[ empty Array ]');
  }
  else if( value.every(i=>typeof i != 'object') ) {
    let text = '';
    let i;
    for( i = 0 ; i < 3 && i < value.length ; i++ ) {
      text += typeof value[i] == 'string'? `"${value[i]}", ` : `${value[i]}, `
    }
    if( i == value.length ) 
      text = text.slice(0, -2);
    else if( i < value.length )
      text += '...';
    return new Hint(`[ ${text} ]`);
  }
  else {
    return new Hint(value.length==1? '[ 1 item ]' : `[ ${value.length} items ]`);
  }
}

class pre extends Element {
  constructor(content,attributes) {
    super('pre', content, attributes);
  }
  renderHtml() {
    return `${this.renderStartTag(0)}${this.renderChildren(0)}${this.renderEndTag(0)}`;
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
class FormattedValue extends Element {
  constructor(value, attributes) {
    super('span', attributes);
    this.children.append(new pre(value));
  }
}
class Hint extends Element {
  constructor(text) {
    super('span',text,{class:'hint'});
  }
}
class MaxDepthExceeded extends Element {
  constructor() {
    super('p','Maximum number of nesting levels exceeded', {class:'warning max-depth-exceeded'});
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
    super(name==''? '&nbsp;': name, options);
    this.classList.add('primitive');
    this.classList.add(typeof value);
    this.children.append(new TypeName(value));
    this.children.append(new FormattedValue(value,{class:'value'}));
  }
}
class UndefinedValue extends DataElement {
  constructor(name, options) {
    super(name, options);
    this.classList.add('undefined');
    this.children.append(new FormattedValue('undefined',{class:'value undefined'}));
  }
}
class ObjectValue extends DataElement {
  constructor(name, value, options) {
    super(name, options);
    this.classList.add('object');
    this.children.append(
      new TypeName(value),
      new Element('span', {class:'data-value'}),
      createHint(value, options)
    );

    if( options?.maxDepth <= 0 ) {
      this.children.append(new MaxDepthExceeded());
      return;
    }
      
    let names = getAllPropertyNames(value);
    if( Array.isArray(options.excludeKeys) )
      names = names.filter(n=>!options.excludeKeys.includes(n));

    if( names.length > 0 ) {
    	names = names.sort();
      const ul = new Element('ul',{class:'data-element object'});
      for( const n of names ) {
        const child = createDataValueElement(n, value[n], options);
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
    this.children.append(
      new TypeName(value),
      new Element('span', {class:'data-value'}),
      createHint(value,options)
    );

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
        ol.children.append(createDataValueElement(outputName, childValue, options));
      }
      this.children.append(ol);
    }
  }
}
class RootValue extends Element {
  constructor(value, options) {
    super(Array.isArray(value)? 'ol' : 'ul', {class:'data-element json root'});

    options = {...JsonDefaultOptions, ...options};
    options.maxDepth ??= JsonDefaultMaxDepth;

    if( value == undefined ) {
      this.children.append(new UndefinedValue('', options));
    }
    else if( Array.isArray(value) ) {
      for( let i = 0 ; i < value.length ; i++ )
        this.children.append(createDataValueElement(i, value[i], options));
    }
    else if( typeof value == 'object' ) {
      const names = getAllPropertyNames(value).sort();
      for( const name of names ) {
        if( !options.excludedProperties?.includes(name) )
          this.children.append(createDataValueElement(name, value[name], options));
      }
    }
    else {
      this.children.append(new PrimitiveValue('', value, options));
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