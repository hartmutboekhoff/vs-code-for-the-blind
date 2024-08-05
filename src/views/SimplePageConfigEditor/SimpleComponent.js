const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine, CheckboxInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');
const {SimpleComponentBase} = require('../helpers/SimpleEditorComponent');

class SimpleComponent extends SimpleComponentBase {
  constructor(obj, schema, key, path, status) {
    super(obj, schema, key, path, status);
    this.setMainContentConfig();
    this.classList.add('generic');
  }
  
  get preventSubElements() {
    return true;
  }
}

exports.view = SimpleComponent;
exports.selectors = [
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: undefined,
  }
];

