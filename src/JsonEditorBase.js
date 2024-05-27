const vscode = require('vscode');
const {resolveJsonHierarchy} = require('./utility');
const CustomEditorBase = require('./CustomEditorBase')

const ConfigPath = 'SparkSiteeconfigEditor';

class JsonEditorBase extends CustomEditorBase {
  #json = {valid:false};
  
  constructor(context, document, webviewPanel, token) {
    super(context, document, webviewPanel, token);
  }

  get json() {
    if( this.#json.valid ) return this.#json.data;
    this.#json = this.#getJson();
    if( this.#json.valid == false && this.#json.error != undefined )
      throw this.#json.error;
    return this.#json.data;
  }
  set json(value) {
    //const old = this.#getJson();
    //this.#differences.push(...diffJson(old.valid? old.data : {}, value));

    try {
      this.#json = {valid:false};
      const text = JSON.stringify(value, null, 4);
  		const edit = new vscode.WorkspaceEdit();
  		edit.replace(this.document.uri,
      			       new vscode.Range(new vscode.Position(0,0), new vscode.Position(this.document.lineCount, 0)), 
      			       text);
  		vscode.workspace.applyEdit(edit);
    }
    catch(e) {
      console.error(e);
			throw new Error('Could not serialize object. Content is not valid json');
    }
  }
  #getJson() {
	  const text = this.text;
	  if (text.trim().length === 0)
		  return {valid:true,data:this.preprocessJSON({})};

	  try {
			return {valid:true, data:this.preprocessJSON(JSON.parse(text))};
		} catch(e) {
		  return {valid:false, error:'Could not get json-ata. Content is not valid json. '+e};
    }
  }
  preprocessJSON(jsonObj) { return jsonObj; }
  
  replaceJson(path, newValue) {
    const json = this.json;
    const nodesCascade = resolveJsonHierarchy(path,json);
    const valueIx = nodesCascade.length-1;
    if( valueIx == 0 ) {
      this.json = newValue;
    }
    else {
      const parentData = nodesCascade[valueIx-1].data;
      if( parentData != undefined ) {
        const valueKey = nodesCascade[valueIx].key;
        parentData[valueKey] = newValue;
        this.json = json;
      }
    }
  }
  resolveJson(path, up=0) {
    const nodes = resolveJsonHierarchy(path, this.json);
    return JSON.parse(JSON.stringify(nodes[nodes.length-1-up]?.data));
  }

} 

module.exports = JsonEditorBase;