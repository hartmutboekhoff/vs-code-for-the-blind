const {Element} = require('../../html');

class Reference extends Element {
  constructor(obj, schema, key, path, status) {
    super('p');
    
    this.children.append(new Element('label', '$ref'),
                         new Element('a', obj, {href:obj}));
  }
  
  get preventSubElements() {
    return true;
  }
}

exports.view = Reference;
exports.selectors = [
  {
    SchemaPath: '#.properties["$ref"]',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: undefined
  },
];
