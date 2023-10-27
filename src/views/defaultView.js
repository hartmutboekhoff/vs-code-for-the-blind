const {Element} = require('../html');

class View extends Element {
  constructor(obj, schema, path, depth) {
    super('p');
    this.children.append(new Element('span',depth));
    this.children.append(new Element('pre',path));
  }
  
  get allowSubElements() {
    return undefined;
  }
}

exports.view = View;
exports.selectors = [
  {
    SchemaPath: undefined,
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "MenuEditor"
  }
];

