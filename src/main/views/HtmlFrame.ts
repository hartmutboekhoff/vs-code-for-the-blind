import * as vscode from 'vscode';

export class Element {
	private _children: Element[] | undefined = undefined;
	public readonly name;
	
	constructor(name='') {
		this.name = name ?? '';
	}

	public get children(): Element[] {
		return this._children ??= [];
	}

	public toString(): string {
		if( this.name.trim() == '' )
			return this._children == undefined? '' : this.children.map(c=>c.toString()).join('\n');
		else
			return `<${this.name}>\n`+this._children == undefined? '' : this.children.map(c=>c.toString()).join('\n')+`\n</${this.name}>`;
	}
}
export class PlainText extends Element {
	public text: string;
	
	constructor(text='') {
		super('');
		this.text = text;	
	}
	public get children(): Element[] {
		return [];
	}
	public toString() {
		return this.text;
	}
}

class Head {
	private readonly frame: HtmlFrame;
	public readonly styleSheets: vscode.Uri[] = [];
	public readonly scripts: vscode.Uri[] = [];
	public title: string = '';
	
	constructor(frame: HtmlFrame) {
		this.frame = frame;
	}
	
	public toString() {
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
	private readonly frame: HtmlFrame;
	
	constructor(frame: HtmlFrame) {
		super('body');
		this.frame = frame;
	}
}

export class HtmlFrame {
	private meta: Head;
	private body: Body;
	public readonly nonce: string;
	
	constructor(name:string) {
		this.nonce = this.getNonce();
		this.meta = new Head(this);
		this.body = new Body(this);
		this.meta.title = name;
	}
	
	public get head(): Head {
		return this.meta;
	}
	public get content(): Body {
		return this.body;
	}
	
	private getNonce(): string {
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
	
	public toString(): string {
		return '<!DOCTYPE html><html lang="en">'
					 + this.meta.toString()
					 + this.body.toString()
					 + '</html>';
	}
	
}