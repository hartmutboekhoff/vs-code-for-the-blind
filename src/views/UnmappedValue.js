const {Element} = require('../html');

class UnmappedValue extends Element {
  constructor(obj, schema, key, path, status) {
    super('p','Unmapped value in json-object at <span class="path">'+path+'</span>',{'class':'generic match-'+status});
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
    EditorType: undefined
  }
];
