const vscode = require('vscode');
const CustomEditorBase = require('./CustomEditorBase');
const Factories = require('./factory');
const JsonSchemaMapper = require('./JsonSchemaMapper')
const {loadJsonData} = require('./loader');
const Traversion = require('./Traverse');
const {HtmlFrame, Element} = require('./html');
const {RootValue} = require('./htmlDataElements');
const {view:UnmappedValue} = require('./views/UnmappedValue.js');

/*
class AllFieldsObject {
  constructor(value, schema) {
    if( value == undefined ) {
      if( schema.type == 'object' ) 
        return this.#asObject(schema);
      if( schema.type == 'array' ) 
        return this.#asArray(schema);
      if( Array.isArray(schema.type) ) {
        if( schema.type.includes('object') ) 
          return this.#asObject(schema);
        if( schema.type.includes('array') ) 
          return this.#asArray(schema);
      }
    }
    else if( Array.isArray(value) ) {
      return this.#asArray(schema,value);
    }
    else if( typeof value == 'object' ) {
      return this.#asObject(schema,value);
    }
    return value;
  }

  #asArray(schema,value) {
    const merged = [];
    if( schema.prefixItems != undefined )
      for( let i = 0 ; i < schema.prefixItems.length ; i++ )
        merged[i] ??= undefined;
    return Object.assign(merged, value);
  }
  #asobject(schema, value) {
    const merged = {};
    if( schema.properties != undefined )
      for( const k in schema.properties )
        merged[k] ??= undefined;
    if( schema.required != undefined )
      for( const k of schema.required )
        merged[k] ??= undefined;
    return Object.assign(merged, value);
  }
}
*/

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
  #applyDebugInfo(view, path, obj, schemaPath, schema, depth) {
    view.classList.add('has-debug-info');
    view.dataset.jsonPath = path;
    view.dataset.jsonData = obj;
    if( schemaPath != undefined ) view.dataset.schemaPath = schemaPath;
    if( schema != undefined ) view.dataset.schema = schema;
    view.dataset.depth = depth;
  }
  
  onValue(obj, key, path, depth) {
    const match = this.mapper.findAll(path);
    if( match.length == 0 ) {
      const umv = new UnmappedValue(obj, undefined, key, path, 'unmatched');
      this.#applyDebugInfo(umv, path, obj);
      this.#insert(umv);
      this.preventNesting();
      return;
    }
    else {
      if( match.length > 1 ) console.warn('Found multiple matches for "'+path+'"');
      
      match.forEach(m=>{
        const view = this.factory
          .get(m.schemaPath.paths, m.schema?.type, Array.isArray(obj)? 'array' : typeof obj)
          ?.getView(obj,m.schema,key,path,m.status);
        
        if( view != undefined ) {
          //view.attributes['view-path'] = path; 
          this.#applyDebugInfo(view, path, obj, m.schemaPath.latest, m.schema, depth);
          
          this.#insert(view);
          this.#setInsertPosition(view, path);
          if( view.preventSubElements == true ) 
            this.preventNesting();
          else if( Array.isArray(view.preventSubElements) )
            this.preventNesting(view.preventSubElements);
        }
      });
      //return new AllFieldsObject(obj, match[0].schema);
      return obj;
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
  #cancelChangeMessage = false;

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
	    .then(()=>this.renderHtml())
	    .catch(e=>this.renderFailScreen(e));
	}

  #createSchemaMapping() {
    this.#mapper = new JsonSchemaMapper(this.#schema, this.json);
  }
  
  initHtml(html) {
	  html.head.title = this.document.fileName;
		//html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'jsonview.css')));
		html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'common.css')));
		//html.head.scripts.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','js', 'jsonview.js')));
		html.head.scripts.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','js', 'editor.js')));
  }
  beforeRendering(html) {
  }
  renderFailScreen(e) {
    this.view.html = '<h1>Oops!</h1><div>Something went terribly wrong.</div>'
                     + (e == undefined
                        ? '' 
                        : typeof e == 'string'
                        ? `<h3 id="error-message">${e}</h3>`
                        : `<h3 id="error-message">${e.message}</h3><div>${e.stack?.replaceAll('\n','<br/>')}</div>`);
  }
  renderHtml() {
    if( this.#factory == undefined ) return this.renderFailScreen(`View-factory "${this.#factoryName}" is not loaded.`);

    const builder = new HtmlBuilder(this.#mapper, this.#factory, {maxDepth:11});
    this.initHtml(builder.html);
    builder.start(this.json);
    this.beforeRendering(builder.html);
		this.view.html = builder.html.toString();
  }

  onValueChangedMessage(message) {
    if( message.viewPath != undefined ) {
      const schemaMatch = this.#mapper.findAll(message.viewPath);
      if( schemaMatch.length == 1 ) {
        const obj = this.resolveJson(message.viewPath);
        const setValueFunction = this.#factory.get(schemaMatch[0].schemaPath.paths, schemaMatch[0].schema?.type, Array.isArray(obj)? 'array' : typeof obj)?.setValue;
        if( typeof setValueFunction == 'function' ) {
          const relativePath = message.path.slice(message.viewPath.length).replace(/^\.+/,'');
          const newValue = setValueFunction(obj, relativePath, message.value)
          
          this.replaceJson(message.viewPath, newValue);
          this.#createSchemaMapping();
          return;
        }
      }
    }
    this.replaceJson(message.path, message.value);
    this.#cancelChangeMessage = true;
  }
  async onDocumentChanged(ev) {
    if( !this.#cancelChangeMessage ) {
      super.onDocumentChanged(ev);
      this.#cancelChangeMessage = false;
    }
  }

}

module.exports = SiteConfigEditor;