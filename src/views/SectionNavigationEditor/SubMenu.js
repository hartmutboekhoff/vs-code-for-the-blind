const {Element} = require('../../html');

class SubMenu extends Element {
  constructor(obj, schema, key, path, status) {
    super('fieldset', {class: 'sub-menu'});
    this.children.append(new Element('legend', 'Submen&uuml;'));
  }
}
class NoFrameSubMenu extends Element {
  constructor(obj, schema, key, path, status) {
    super();
  }
}

exports.view = NoFrameSubMenu;
exports.selectors = [
  {
    SchemaPath: '#.definitions.IndexSubnavigation.properties.subMenu',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SectionNavigationEditor"
  }
];

