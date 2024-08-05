const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');
const {SimpleComponentBase} = require('../helpers/SimpleEditorComponent')


class OpulenceBoxComponent extends SimpleComponentBase {
  constructor(obj, schema, key, path, status) {
    super(obj, schema, key, path, status);

    this.setMainContentConfig('teasers', 'Anzahl kleine Teaser');
  }
  
}

exports.view = OpulenceBoxComponent;
exports.selectors = [
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'OPULENZ_BOX',
  }
];

