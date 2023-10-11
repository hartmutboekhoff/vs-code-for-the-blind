class Element {
	#children;
	#name;
	
	constructor(name='') {
		this.#name = name ?? '';
	}

	get name() {return this.#name;}
	
	get children() {
		return this.#children ??= [];
	}

  #renderChildren() {
    return this.#children == undefined? '' : this.#children.map(c=>c.toString()).join('\n');
  }
	toString() {
		if( this.name.trim() == '' )
			return this.#renderChildren();
		else
			return `<${this.#name}>\n${this.#renderChildren()}\n</${this.name}>`;
	}
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
	
	constructor(name) {
		this.#head = new Head(this);
		this.#body = new Body(this);
		this.#head.title = name;
		
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
  HtmlFrame 
}