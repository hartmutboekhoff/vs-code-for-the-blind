const {Element} = require('../html');

class GenericArray extends Element {
  constructor(obj, schema, key, path, status) {
    super();
  }
  
  get preventSubElements() {
    return false;
  }
}

exports.view = GenericArray;
exports.selectors = [
  {
    SchemaPath: undefined,
    SchemaType: 'array',
    DataType: undefined,
    EditorType: "MenuEditor"
  }
];
