function htmlEncode(text) {
  // ToDo: implement html-encoding
  return text;
}
function isValidAttributeName(n) {
  return /^[a-zA-Z_][a-zA-Z-_]*$/.test(n);
}

class ChildrenList extends Array {
  #parent; 
    
  constructor(parent) {
    super();
    this.#parent = parent;
  } 
  
  push(...elements) { super.push(...elements); }
  append(...elements) { super.push(...elements); }
  unshift(...elements) { super.unshift(...elements); }
  insertBefore(element,before) { 
    const index = super.indexOf(before);
    if( index >= 0 ) super.splice(index,0,element);
  }
  insertAfter(element,after) {
    const index = super.indexOf(after);
    if( index >= 0 ) super.splice(index+1,0,element);
  }
  insertAt(element,index) { super.splice(index,0,element); }
  remove(element) {
    const index = super.indexOf(element);
    if( index >= 0 ) this.removeAt(index);
  }
  removeAt(index) { super.splice(index,1); }
  
  toString() {
    return this.map(e=>e.toString()).join('\n');
  }
}

class Attributes {
/*
  constructor() {
    return new (class {
      constructor(attr) {
        return new Proxy(attr,this);
      }
      get(target, property, receiver) {
        return target[property];
      }
      set(target, property, value) {
        assertAttributeName(property);
        if( value == undefined )
          delete target[property];
        else
          target[property] = htmlEncode(value.toString());
      }
    })(this);
  }
*/
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
            result = v==true? `${result} ${a}` : `${result} ${a}="${v}"`;
            break;
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
class Element {
  static #debugMode = true;
	#children; #attributes;
	#name;
	
	constructor(name='', textContent, attributes) {
		this.#name = name ?? '';
		if( attributes == undefined && typeof textContent == 'object' )
		  [attributes, textContent] = [textContent, attributes]; //swap

		if( textContent != undefined )
		  this.children.push(new PlainText(textContent))
		if( attributes != undefined )
		  Object.assign(this.attributes, attributes)
	}

	get name() {return this.#name;}
	set name(name) { this.#name = name; }
	get children() {
		return this.#children ??= new ChildrenList(this);
	}
	get attributes() {
	  return this.#attributes ??= new Attributes();
	}
	set attributes(v) {
    Object.assign(this.#attributes, v);
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
	
	hasAttributes() {
	  return this.#attributes != undefined && this.#attributes.length > 0;
	}
  #renderChildren() {
    //console.log(this.#children);
    return (this.#children?.toString()) ?? '';
  }
	toString() {
	  try {
  		if( this.name.trim() == '' )
  			return this.#renderChildren();
  		
  		const attr = !this.#attributes? '' : this.#attributes.toString();
  		const debug = (Element.DebugMode && this.constructor.name != 'Element')? ` title="${this.constructor.name}" dtat-element-type="${this.constructor.name}"` : '';
  		const alt = (Element.DebugMode && this.constructor.name != 'Element' && (this.#attributes == undefined || !('alt' in this.#attributes)))? ` alt="${this.constructor.name}"` : '';
			return `<${this.#name}${attr}${debug}${alt}>\n${this.#renderChildren()}\n</${this.name}>`;
    }
    catch(e) {
      return e.toString();
    }
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
	toString() {
		return this.text;
	}
}

class EmptyElement extends Element {
  constructor(name, attributes) {
    super(name, attributes);
  }
  toString() {
		const attr = !this.hasAttributes? '' : this.attributes.toString();
    return `<${this.name}${attr}/>`;
  }
}
class BR extends EmptyElement {
  constructor() {
    super('br');
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
	
	toString() {
		return '<head>'
					 + '<meta charset="UTF-8">'
					 //+ -- '<meta http-equiv="Content-Security-Policy" content="default-src "none"; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">'
					 + '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
					 + this.styleSheets.map(s=>`<link href="${s.toString()}" rel="stylesheet" />`).join('\n')
					 + this.scripts.map(s=>`<script defer nonce="${this.frame.nonce}" src="${s.toString()}"></script>`).join('\n')
					 + '<title>' + this.title
					 + '</title></head>';
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
	
	toString() {
		return '<!DOCTYPE html><html lang="en">'
					 + this.head.toString()
					 + this.body.toString()
					 + '</html>';
	}
}

module.exports = {
  Element,
  PlainText, 
  EmptyElement,
  BR,
  HtmlFrame 
}