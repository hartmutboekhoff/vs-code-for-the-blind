const {Element} = require('../../html');
const {TextInput, TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {TopicHeader} = require('../helpers/ComponentParts');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');
const {SimpleComponentBase} = require('../helpers/SimpleEditorComponent')


class EPaperLandingPageOpenerComponent extends SimpleComponentBase {
  constructor(obj, schema, key, path, status) {
    super(obj, schema, key, path, status);

    this.children.append(new TextInputLine(obj.path+'.params.title', 'Überschrift', obj.params.title));   
  }
  
}

exports.view = EPaperLandingPageOpenerComponent;
exports.selectors = [
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'E_PAPER_LANDINGPAGE_OPENER',
  }
];





