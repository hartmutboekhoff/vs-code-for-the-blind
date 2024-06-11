const INDENT_STRING = '\t';

function htmlEncode(text) {
  switch(typeof text) {
    case 'undefined': return '';
    case 'string': return text.replaceAll('"','&quot;');
    default: return text.toString().replaceAll('"','&quot;');
  }
}
function isValidAttributeName(n) {
  return /^[a-zA-Z_][a-zA-Z-_]*$/.test(n);
}

class ChildElements extends Array {
  #parent; 
    
  constructor(parent) {
    super();
    this.#parent = parent;
  } 
  
  #ensureElements(params) {
    return params.map(p=>{
      if( p instanceof Element ) return p;
      if( typeof p == 'string' ) return new PlainText(p);
      if( Array.isArray(p) ) return this.#ensureElements(p);
    }).flat(Infinity);
  }
  push(...elements) { super.push(...this.#ensureElements(elements)); }
  append(...elements) { 
    super.push(...this.#ensureElements(elements)); 
    return elements.length == 0? undefined : elements.length == 1? elements[0] : elements;
  }
  unshift(...elements) { super.unshift(...this.#ensureElements(elements)); }
  insertBefore(before, ...elements) { 
    const index = super.indexOf(before);
    if( index < 0 ) return undefined;
    super.splice(index,0,...this.#ensureElements(elements));
    return elements.length == 0? undefined : elements.length == 1? elements[0] : elements;
  }
  insertAfter(after, ...elements) {
    const index = super.indexOf(after);
    if( index < 0 ) return undefined;
    super.splice(index+1,0, ...this.#ensureElements(elements));
    return elements.length == 0? undefined : elements.length == 1? elements[0] : elements;
  }
  insertAt(index, ...elements) { 
    super.splice(index,0, ...this.#ensureElements(elements)); 
    return elements.length == 0? undefined : elements.length == 1? elements[0] : elements;
  }
  remove(...elements) {
    elements.forEach(e=>{
      const index = super.indexOf(e);
      if( index >= 0 ) 
        this.removeAt(index);
    });
  }
  removeAt(index) { super.splice(index,1); }
  clear() { super.splice(0, Infinity); }
  
  renderHtml(indent=0) {
    return this.map(e=>e.renderHtml(indent)).join('\n');
  }
  toString() {
    return this.renderHtml();
  }
}

class Attributes {
  constructor(attr) {
    Object.assign(this,attr);
  }

  toString() {
    let result = '';
    for( const a in this ) {
      if( isValidAttributeName(a) ) {
        const v = this[a];
        switch( typeof v ) {
          case 'string':
          case 'number':
            result = `${result} ${a}="${htmlEncode(v)}"`;
            break;            
          case 'boolean':
            if( v ) result = `${result} ${a}`;
            break;
          case 'object':
            if( Element.DebugMode )
              result = `${result} ${a}="${htmlEncode(JSON.stringify(v))}"`;
        }
      }
    }
    return result;
  }
}

class TokenList {
  #element; #tokens;
  
  constructor(element) {
    this.#element = element;
    this.#tokens = new Set(element.className.split(/\s/).filter(s=>s!=''));
  }
  #update() {
    this.#element.className = this.toString();
  }
  add(name) {
    this.#tokens.add(name);
    this.#update();
  }
  remove(name) {
    this.#tokens.delete(name);
    this.#update();
  }
  toggle(name) {
    if( !this.remove(name) )
      this.add(name);
    this.#update();
  }
  clear() {
    this.#tokens.clear();
    this.#update();
  }
  has(name) {
    return this.#tokens.has(name);
  }
  
  toString() {
    return [...this.#tokens].join(' ');
  }
}
class Dataset {
  constructor(element) {
    return new Proxy(element, this);
  }

  #toAttributeName(cc) {
    return 'data-' + cc.replaceAll(/[A-Z]/g,m=>'-'+m.toLowerCase());
  }
  
  get(target,prop,receiver) {
    return target.attributes[this.#toAttributeName(prop)];
  }
  set(target,prop,value) {
    target.attributes[this.#toAttributeName(prop)] = value;
    return true;
  }
}

const SelfClosingTags = [
  'br', 'input', 'hr', 'img', 'meta', 'link' 
];

class Element {
  static #debugMode = true;
	#children; #attributes;
	#name;
	
	constructor(name='', textContent, attributes) {
		this.#name = name ?? '';
		if( attributes == undefined && typeof textContent == 'object' )
		  [attributes, textContent] = [textContent]; //swap

		if( textContent != undefined )
		  this.children.append(new PlainText(textContent))
		if( attributes != undefined )
		  Object.assign(this.attributes, attributes)
	}

	get name() {return this.#name;}
	set name(name) { this.#name = name?.trim(); }
	get id() { return this.#attributes?.['id'];	}
	set id(v) { this.attributes['id'] = v; }
	get children() {
		return this.#children ??= new ChildElements(this);
	}
	get attributes() {
	  return this.#attributes ??= new Attributes();
	}
	set attributes(v) {
    Object.assign(this.attributes, v);
	}

  get innerText() {
    return this.#children?.reduce((c,acc)=>`${acc} ${c.innerText}`,'') ?? '';
  }
  set innerText(v) {
    this.children.clear();
    this.children.append(new PlainText(v));
  }
  
	get className() {
	  return this.#attributes?.['class'] ?? '';
	}
	set className(v) {
	  this.attributes['class'] = v;
	}
	get classList() {
	  return new TokenList(this);
	}
	get dataset() {
	  return new Dataset(this);
	}
	
	hasAttributes() {
	  return this.#attributes != undefined && this.#attributes.length > 0;
	}
  
  hasName() { return this.name != ''; }
  renderStartTag(indent=0) {
    return this.hasName()? `${INDENT_STRING.repeat(indent)}<${this.name}${this.renderAttributes()}>` : '';
  }
  renderEndTag(indent=0) {
    return this.hasName()? `${INDENT_STRING.repeat(indent)}</${this.name}>` : '';
  }
  renderEmptyTag(indent=0) {
    return this.hasName()? `${INDENT_STRING.repeat(indent)}<${this.name}${this.renderAttributes()}/>` : '';
  }
  renderAttributes() {
    return (this.#attributes? this.#attributes.toString() : '')
           + ((Element.DebugMode && this.constructor.name != 'Element')? ` title="${this.constructor.name}" dtat-element-type="${this.constructor.name}"` : '');
  }
  renderChildren(indent=0) {
    return (this.#children?.renderHtml(indent)) ?? '';
  }
  
  renderHtml(indent=0) {
    if( false === this.preRender?.() )
      return '';
    
    const html = this.#renderHtml(indent);
    return this.postRender?.(html) ?? html;
  }
  #renderHtml(indent=0) {
    try {
      if( !this.hasName() ) 
        return this.renderChildren(indent);

      if( this.#children == undefined || this.#children.length == 0 ) {
        if( SelfClosingTags.includes(this.name) )
          return this.renderEmptyTag(indent);
        else
          return `${this.renderStartTag(indent)}${this.renderEndTag(0)}`;
      }
      else {
        const innerHTML = this.renderChildren(indent+1);
        if( innerHTML == '' )
          return `${this.renderStartTag(indent)}${this.renderEndTag(0)}`;
        else
          return `${this.renderStartTag(indent)}\n${innerHTML}\n${this.renderEndTag(indent)}`;
      }
    }
    catch(e) {
      console.error(e);
      return e.toString();
    }
  }
  toString() {
    return this.renderHtml();
  }
	
	static get DebugMode() {return Element.#debugMode;}
	static set DebugMode(v) {Element.#debugMode = v==true;}
}
class PlainText extends Element {
	constructor(text='') {
		super('');
		this.text = text;	
	}
	get children() {
		return [];
	}
	get innerText() {
	  return this.text;
	}
	set innerText(v) {
	  this.text = v;
	}
	renderHtml(indent) {
	  return typeof this.text != 'string'
	          ? this.text
	          : this.text.trim() != ''
	          ? INDENT_STRING.repeat(indent)+this.text.replace(/\n/mg,INDENT_STRING.repeat(indent))
	          : '';
	}
}

class EmptyElement extends Element {
  constructor(name, attributes) {
    super(name, attributes);
  }
	get children() {
		return [];
	}
  renderHtml(indent) {
    return this.renderEmptyElement(indent);
  }
}
class BR extends EmptyElement {
  constructor() {
    super('br');
  }
}

class Textarea extends Element {
  constructor(value, attributes) {
    super('textarea', attributes);
    this.value = value ?? '';
  }

  get children() {
    return [];
  }  
	renderHtml(indent) {
	  try {
	    return `${this.renderStartTag(indent)}${this.value}${this.renderEndTag(indent)}`;
    }
    catch(e) {
      return e.toString();
    }
	}  
}

class Head {
	#frame;
	#styleSheets  = [];
	#scripts = [];
	
	constructor(frame) {
		this.frame = frame;
	  this.title = '';
	}
	
	get styleSheets() {return this.#styleSheets;}
	get scripts() {return this.#scripts;}
	
	renderHtml() {
		return '<head>'
					 + '\n'+INDENT_STRING+'<meta charset="UTF-8">'
					 //+ -- '<meta http-equiv="Content-Security-Policy" content="default-src "none"; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">'
					 + '\n'+INDENT_STRING+'<meta name="viewport" content="width=device-width, initial-scale=1.0">'
					 + this.styleSheets.map(s=>`${INDENT_STRING}<link href="${s.toString()}" rel="stylesheet" />`).join('\n')
					 + this.scripts.map(s=>`${INDENT_STRING}<script defer nonce="${this.frame.nonce}" src="${s.toString()}"></script>`).join('\n')
					 + '\n'+INDENT_STRING+'<title>' + this.title
					 + '</title>\n</head>';
	}
}
class Body extends Element {
	#frame;
	
	constructor(frame) {
		super('body');
		this.#frame = frame;
	}
}

class HtmlFrame {
	#head;
	#body;
	#nonce;
	
	constructor(title) {
		this.#head = new Head(this);
		this.#body = new Body(this);
		this.#head.title = title ?? '';
		
		this.#initNonce();
	}
	
	get head() {
		return this.#head;
	}
	get body() {
		return this.#body;
	}
	get nonce() {return this.#nonce;}
	
	#initNonce() {
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		this.#nonce = text;
	}
	
	renderHtml() {
		return '<!DOCTYPE html><html lang="en">'
					 + this.head.renderHtml()
					 + this.body.renderHtml()
					 + '</html>';
	}
	toString() {
	  return this.renderHtml();
	}
}

module.exports = {
  Element,
  ChildElements,
  PlainText, 
  EmptyElement,
  BR,
  Textarea,
  HtmlFrame 
}