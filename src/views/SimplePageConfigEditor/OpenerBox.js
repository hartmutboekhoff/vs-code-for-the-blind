const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');
const {SimpleComponentBase} = require('../helpers/SimpleEditorComponent')


class OpenerBoxComponent extends SimpleComponentBase {
  constructor(obj, schema, key, path, status) {
    super(obj, schema, key, path, status);


    this.children.append(new TextInputLine(path+'.params.label', 'Beschriftung', obj.params.label))
    this.children.append(new TextInputLine(path+'.params.variant', 'Layout', obj.params.variant))

    this.setMainContentConfig('teasers', 'Anzahl kleine Teaser');
  }
  
}

exports.view = OpenerBoxComponent;
exports.selectors = [
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'OPENER_BOX',
  }
];

