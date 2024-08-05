const {Element} = require('../../html');

class SimpleEditorFrame extends Element {
  constructor(obj, schema, key, path, status) {
    super();
  }

  get preventSubElements() {
    return ['viewGroups', 'meta'];
  }
}

exports.view = SimpleEditorFrame;
exports.selectors = [
  {
    SchemaPath: '#',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor"
  }
];

