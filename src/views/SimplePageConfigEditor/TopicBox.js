const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {TopicHeader} = require('../helpers/ComponentParts');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');
const {SimpleComponentBase} = require('../helpers/SimpleEditorComponent')


class TopicBoxComponent extends SimpleComponentBase {
  constructor(obj, schema, key, path, status) {
    super(obj, schema, key, path, status);

    this.setMainContentConfig('teasers');
    this.children.append(new TopicHeader(obj.params.topicHeader));    
  }
  
}

exports.view = TopicBoxComponent;
exports.selectors = [
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'TOPIC_BOX',
  }
];

