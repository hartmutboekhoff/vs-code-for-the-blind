const {Element} = require('../html');

class UnmappedValue extends Element {
  constructor(obj, schema, key, path, status) {
    super('p','Unmapped value in json-object at "'+path+'"',{'class':'error'});
  }
  
  get preventSubElements() {
    return true;
  }
}

exports.view = UnmappedValue;
exports.selectors = [
  {
    SchemaPath: /\[\?\]$/,
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "MenuEditor"
  }
];
