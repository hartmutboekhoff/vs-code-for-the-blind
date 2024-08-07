const {Element} = require('../../html');

class SectionNavigationEditorFrame extends Element {
  constructor(obj, schema, key, path, status) {
    super();
  }

  getSubkeys() {
    return 'categories';
  }
}

exports.view = SectionNavigationEditorFrame;
exports.selectors = [
  {
    SchemaPath: '#',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SectionNavigationEditor"
  }
];

