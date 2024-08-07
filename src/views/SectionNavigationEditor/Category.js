const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, PopupValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');


class Category extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, key, undefined, {class: 'section-options'});
    if( obj.indexSubnavigation == undefined ) {
      this.collapsed = true;
      this.classList.add('disabled');
    }
  }
  getSubkeys() {
    return 'indexSubnavigation';
  }
}

exports.view = Category;
exports.selectors = [
  {
    SchemaPath: '#.definitions.SectionOptions',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SectionNavigationEditor"
  }
];

