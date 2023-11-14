const {Element} = require('../html');

class DefaultView extends Element {
  constructor(obj, schema, key, path, status) {
    super('fieldset', {class:'generic'});
    this.children.append(new Element('legend', key+' - '+path));
    
    const value = new Element('pre',JSON.stringify(obj,undefined,2).slice(0,100));
    this.children.append(value);
  }
  
  get preventSubElements() {
    return false;
  }
}

exports.view = DefaultView;
exports.selectors = [
  {
    SchemaPath: undefined,
    SchemaType: undefined,
    DataType: undefined,
    EditorType: undefined
  }
];

