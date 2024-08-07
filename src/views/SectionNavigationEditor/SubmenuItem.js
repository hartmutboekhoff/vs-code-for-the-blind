const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, PopupValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');


class SubmenuItem extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, obj.label, obj.path, {class: 'menu-item'});
    this.collapsed = true;
    this.children.append(
      new TextInputLine(path+'.label', 'Text', obj.label),
      new TextInputLine(path+'.path', 'Url', obj.path)
    );
  }
  get preventSubElements() {
    return ['label', 'path'];
  }
}

exports.view = SubmenuItem;
exports.selectors = [
  {
    SchemaPath: '#.definitions.IndexSubnavigation.properties.subMenu.items',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SectionNavigationEditor"
  }
];

