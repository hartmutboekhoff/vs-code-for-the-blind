const {Element} = require('../html');

class GenericRoot extends Element {
  constructor(obj, schema, key, path, status) {
    super();
  }
  
  get preventSubElements() {
    return false;
  }
}

exports.view = GenericRoot;
exports.selectors = [
  {
    SchemaPath: '#',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: undefined
  }
];
