require('./Set');
const vscode = require('vscode');
const JsonEditorBase = require('./JsonEditorBase');
const Factories = require('./factory');
const JsonSchemaMapper = require('./JsonSchemaMapper')
const {loadJsonData} = require('./loader');
const Traversion = require('./Traverse');
const {HtmlFrame, Element} = require('./html');
const {RootValue} = require('./htmlDataElements');
const {view:UnmappedValue} = require('./views/UnmappedValue.js');
const {resolveJsonSchemaPath, buildJsonPath} = require('./utility');

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
  
  constructor(mapper, factory, traverseoptions) {
    super(traverseoptions);
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
    view.dataset.jsonData = JSON.stringify(obj);
    if( schemaPath != undefined ) view.dataset.schemaPath = schemaPath;
    if( schema != undefined ) view.dataset.schema = JSON.stringify(schema);
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
        const inflatedSchema = this.mapper.getFullyExpandedSchema(m.schema);
        const view = this.factory
          .get({
            SchemaPath: m.schemaPath.paths, 
            SchemaType: inflatedSchema?.type, 
            DataType: Array.isArray(obj)? 'array' : typeof obj, 
            //EditorType: undefined, 
            ComponentType: obj.type
          })
          ?.getView(obj,inflatedSchema,key,path,m.status);
        
        if( view != undefined ) {
          //view.attributes['view-path'] = path; 
          this.#applyDebugInfo(view, path, obj, m.schemaPath.latest, m.schema, depth);
          
          this.#insert(view);
          this.#setInsertPosition(view, path);
          
          if( view.preventSubElements == true ) 
            this.preventNesting();
          else if( Array.isArray(view.preventSubElements) )
            this.preventNesting(view.preventSubElements);
          else if( Array.isArray(view.getSubkeys?.()) )
            this.nestingOptions.included = view.getSubkeys();
          else if( typeof view.getSubkeys?.() == 'string' )
            this.nestingOptions.included = [view.getSubkeys()];

         if( this.nestingOptions.included.length == 0 
             && m.schema?.type == 'object'
             && m.schema.properties != undefined ) {
           if( this.nestingOptions.excluded.length == 0 )
            this.nestingOptions.required = Object.keys(m.schema.properties);
           else
             this.nestingOptions.included = Object.keys(m.schema.properties);
         }


        }
        //else 
        //  this.#insert(new Element('p', `No view found for "${key}"`));
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

class HtmlFragmentBuilder {
  #factory; #schema;
  #fragmentSchemaRoot; #fragmentJsonRoot;
  
  constructor(factory, schema, subSchemaPath, jsonPath) {
    this.#factory = factory;
    this.#schema = schema;
    this.#fragmentSchemaRoot = subSchemaPath;
    this.#fragmentJsonRoot = jsonPath;
  }
  
  generate(schemaKey, jsonKey) {
    this.html = this.#getView(this.#fragmentSchemaRoot+'.'+schemaKey,buildJsonPath(this.#fragmentJsonRoot, jsonKey));
  }
  #getView(subSchemaPath, jsonPath) {
    const subSchema = resolveJsonSchemaPath(subSchemaPath,this.#schema);
    const view = this.#factory.get(subSchemaPath,subSchema.type)
                     .getView(undefined,jsonPath);
    if( view == undefined || view.preventSubElements === true )  
      return view;
      
    if( subSchema.type == 'object' ) {
      let keylist = new Set(Object.keys(subSchema.properties));
      if( typeof view.preventSubElements == 'array' )
        keylist = keylist.difference(new Set(view.preventSubElements));

      [...keylist].forEach(k=>{
        view.children.append(this.#getView(
          buildJsonPath(subSchemaPath,'properties',k),
          buildJsonPath(jsonPath,k)
        ))
      });
    }
    return view;
  }
}

class SiteConfigEditor extends JsonEditorBase {
  #factoryName; #factory; 
  #schemaPath; #schema;  #mapper;
  #cancelChangeMessage = false;

	constructor(context, document, webviewPanel, factoryName, schemaPath, token) {
	  super(context, document, webviewPanel, token)
    this.#factoryName = factoryName;
    this.#schemaPath = schemaPath;
	}
	async initialize() {
	  this.#factory = await Factories.get(this.#factoryName);

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
		html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'common.css')));
		html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','css', 'match-marker-badge.css')));
		//html.head.scripts.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','js', 'jsonview.js')));
		html.head.scripts.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media','js', 'editor.js')));
		if( this.settings.developerMode == true ) {
  		html.head.styleSheets.push(this.view.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'css', 'develop.css')));
  		html.body.classList.add('dev-mode');
  	}
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

    const builder = new HtmlBuilder(this.#mapper, this.#factory, {maxDepth:15});
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
  onAddItemMessage(message) {
    console.log('add item:', message);
    
    const builder = new HtmlFragmentBuilder(this.#factory, this.#schema, message.schemaPath, message.jsonPath);
    builder.generate(message.schemaKey, message.jsonKey??1234);
console.log(builder.html.toString());    
    this.postMessage('addItem',{
      jsonPath:message.jsonPath,
      newElement: builder.html.toString(),
    });
    
    const subSchema = resolveJsonSchemaPath(message.schemaPath, this.#schema);
    const itemSchema = resolveJsonSchemaPath(message.schemaKey, subSchema, this.#schema);
console.log(itemSchema, subSchema);    

    const view = this.#factory
      .get(message.schemaPath+'.'+message.schemaKey, itemSchema?.type, undefined);
      //?.getView(obj,m.schema,key,path,m.status);
console.log(view);
console.log(view.getView(undefined,itemSchema,100,message.jsonPath+'[100]','valid').renderHtml());

  }
  async onDocumentChanged(ev) {
    if( !this.#cancelChangeMessage ) {
      super.onDocumentChanged(ev);
      this.#cancelChangeMessage = false;
    }
  }

}

module.exports = SiteConfigEditor;