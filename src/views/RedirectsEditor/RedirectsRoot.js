const {Element} = require('../../html');
const {ValueGroupWrapper} = require('../helpers/dataElementViews');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {splitJsonPath, renameObjectProperty} = require('../../utility');

class RedirectsRoot extends Element {
  constructor(obj, schema, key, path, status) {
    //super(schema, key, 'Redirectsss', {class:'redirect match-'+status});
    super('div');
    this.attributes['view-path'] = path;
    
  }
  
  get preventSubElements() {
    return false;
  }
}

function setValue(obj, relativePath, value) {
  if( relativePath.endsWith('--name')) {
    const oldKey = splitJsonPath(relativePath.slice(0,-6))[0];
    const newKey = value;
    const res = renameObjectProperty(obj, oldKey, newKey);
    return res;
  }
  return obj;
}

exports.view = RedirectsRoot;
exports.setValue = setValue;
exports.selectors = [
  {
    SchemaPath: '#',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: 'RedirectsEditor'
  }
];
