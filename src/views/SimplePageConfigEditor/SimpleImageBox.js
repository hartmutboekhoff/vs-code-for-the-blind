const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {TopicHeader} = require('../helpers/ComponentParts');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');
const {SimpleComponentBase} = require('../helpers/SimpleEditorComponent')


class SimpleImageBoxComponent extends SimpleComponentBase {
  constructor(obj, schema, key, path, status) {
    super(obj, schema, key, path, status);

    this.setMainContentConfig('teasers');
    this.children.append(new TextInputLine(obj.path+'.params.linkUrl', 'Link-Url', obj.params.linkUrl));    
  }
  
}

exports.view = SimpleImageBoxComponent;
exports.selectors = [
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'SIMPLE_IMAGEBOX',
  }
];

