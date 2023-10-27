const vscode = require('vscode');
const CustomEditorBase = require('./CustomEditorBase');
const Factories = require('./factory');
const JsonSchemaMapper = require('./JsonSchemaMapper')
const {loadJsonData} = require('./loader');
const Traversion = require('./Traverse');
const {HtmlFrame, Element} = require('./html');
const {RootValue} = require('./htmlDataElements');

class Renderer extends Traversion {
  constructor(html, mapper, factory, options) {
    super(options);
    this.html = html;
    this.mapper = mapper;
    this.factory = factory;
  }
  
  onValue(obj, key, path, depth) {
    const match = this.mapper.findAll(path);
    if( match.length == 0 ) {
      console.warn('Unmapped value in json-object', path);
      this.html.body.children.append(new Element('p','Unmapped value in json-object "'+path+'"',{'class':'error'}));
      this.preventNesting();
      return;
    }
    else {
      match.forEach(m=>{
        const ViewClass = this.factory.get(m.schemaPath.paths, m.schema?.type, Array.isArray(obj)? 'array' : typeof obj);
        if( ViewClass != undefined ) {
          const view = new ViewClass(obj,m.schema,path,depth);
          this.html.body.children.append(view);
          if( view.allowSubElements == false )
            this.preventNesting();
        }
      });
    }
  }
}









class SiteConfigEditor extends CustomEditorBase {
  #factoryName; #factory; 
  #schemaPath; #schema;  #mapper;

	constructor(context, document, webviewPanel, factoryName, schemaPath, token) {
	  super(context, document, webviewPanel, token)
    this.#factoryName = factoryName;
    this.#schemaPath = schemaPath;
	}
	initialize() {
	  this.#factory = Factories[this.#factoryName];

	  loadJsonData(this.#schemaPath)
	    .then(json=>this.#schema=json)
	    .then(()=>this.#createSchemaMapping())
	    .then(()=>this.renderHtml());
	}

  #createSchemaMapping() {
    this.#mapper = new JsonSchemaMapper(this.#schema, this.json);
  }
  
	initHtml(html) {
		html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'jsonview.css')));
		html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'MenuEditor.css')));
		html.head.scripts.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','js', 'jsonview.js')));
		html.head.scripts.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','js', 'MenuEditor.js')));
	}  
	
  renderHtml() {
		const html = new HtmlFrame(this.document.fileName);
		this.initHtml(html);

    if( false ) {
      html.body.children.append(new RootValue(this.#mapper.mapped.sort((a,b)=>a.jsonPath.localeCompare(b.jsonPath)).slice(0,20), {maxDepth: 4}));
  		this.view.html = html.toString();
      return;
    }
/*
    let preventNestingFor = undefined;
    traverseObject(
      this.json,
      (obj,path,key,depth)=>{
        const match = this.#mapper.findAll(path);
        if( match.length == 0 ) {
          console.warn('Unmapped value in json-object', path);
          html.body.children.append(new Element('p','Unmapped value in json-object "'+path+'"',{'class':'error'}));
          return;
        }
        else {
console.log('found match',path,match);
          match.forEach(m=>{
            const ViewClass = this.#factory.get(m.schemaPath.paths, m.schema?.type, Array.isArray(obj)? 'array' : typeof obj);
console.log('View', path, ViewClass);            
            if( ViewClass != undefined ) {
              const view = new ViewClass(obj,m.schema,path,depth);
              html.body.children.append(view);
              preventNestingFor = view.allowSubElements == false? obj : undefined;
            }
          });
        }
      },
      obj=>preventNestingFor==obj? {} : obj,
      {maxDepth:3}
    );
*/
    const renderer = new Renderer(html, this.#mapper, this.#factory, {maxDepth:3});
    renderer.start(this.json);
		this.view.html = html.toString();
  }
  
  /* getView(value, path) {
    const m = this.getSchemaMatches(path);
    if( Array.isArray(m) ) {
      if( m.length > 1 )
        throw 'Implementation incomplete'
      m = m[0];
    }
    return this.#factory.get(
      m.schemaPath.paths,
      m.schema?.type,
      typeof(value)
    );
  } */
 /*  getSchemaMatches(search) {
    return this.#mapper.findAll(search)
  } */

}

module.exports = SiteConfigEditor;