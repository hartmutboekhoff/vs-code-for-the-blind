const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');
const {SimpleComponentBase} = require('../helpers/SimpleEditorComponent')


class TeaserSlicerComponent extends SimpleComponentBase {
  constructor(obj, schema, key, path, status) {
    super(obj, schema, key, path, status);

    this.children.append(new TextInputLine(path+'.params.fullPathLabel', 'Link-Text', obj.params.fullPathLabel));
    this.children.append(new TextInputLine(path+'.params.fullPath', 'Link-Url', obj.params.fullPath));
    this.children.append(new TextInputLine(path+'.params.variant', 'Layout Variante', obj.params.variant));
    this.setMainContentConfig('teasers');
  }
  
}

exports.view = TeaserSlicerComponent;
exports.selectors = [
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'TEASER_SLIDER',
  }
];

