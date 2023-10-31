const vscode = require('vscode');
const CustomEditorBase = require('./CustomEditorBase');
const Factories = require('./factory');
const JsonSchemaMapper = require('./JsonSchemaMapper')
const {loadJsonData} = require('./loader');
const Traversion = require('./Traverse');
const {HtmlFrame, Element} = require('./html');
const {RootValue} = require('./htmlDataElements');
const {view:UnmappedValue} = require('./views/UnmappedValue.js');

class HtmlBuilder extends Traversion {
  #insertPositionStack =  []; // elements are inserted by unshift()
  
  constructor(mapper, factory, options) {
    super(options);
    this.html = new HtmlFrame();
    this.#setInsertPosition(this.html.body, '');
    this.mapper = mapper;
    this.factory = factory;
  }
  
  #setInsertPosition(element,path) {
    this.#insertPositionStack.unshift({element,path});
  }
  #deleteInsertPosition(path) {
    const ix = this.#insertPositionStack.findIndex(p=>p.path==path);
    if( ix >= 0 )
      this.#insertPositionStack.splice(0,ix+1);
  }
  #insert(...elements) {
    this.#insertPositionStack[0].element.children.append(...elements);
  }
  
  onValue(obj, key, path, depth) {
if( path == 'legalNav')    
  console.log('legalNav:', obj, key, path, depth);
    const match = this.mapper.findAll(path);
    if( match.length == 0 ) {
      this.#insert(new UnmappedValue(obj, undefined, key, path, 'unmatched'));
      this.preventNesting();
      return;
    }
    else {
      match.forEach(m=>{
        const ViewClass = this.factory.get(m.schemaPath.paths, m.schema?.type, Array.isArray(obj)? 'array' : typeof obj);
        if( ViewClass != undefined ) {
          const view = new ViewClass(obj,m.schema,key,path,m.status);
          this.#insert(view);
          this.#setInsertPosition(view, path);
          if( view.preventSubElements == true ) 
            this.preventNesting();
          else if( Array.isArray(view.preventSubElements) )
            this.preventNesting(view.preventSubElements);
        }
      });
    }
  }
  onNoNesting(obj, key, path) {
    this.#deleteInsertPosition(path);
  }
  afterNesting(obj, key, path) {
    this.#deleteInsertPosition(path);
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
	  html.head.title = this.document.fileName;
		html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'jsonview.css')));
		html.head.scripts.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','js', 'jsonview.js')));
  }
  renderHtml() {
    const builder = new HtmlBuilder(this.#mapper, this.#factory, {maxDepth:5});
    this.initHtml(builder.html);
    builder.start(this.json);
		this.view.html = builder.html.toString();
  }
}

module.exports = SiteConfigEditor;