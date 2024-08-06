const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');
const {SimpleComponentBase} = require('../helpers/SimpleEditorComponent')


class PlusOpenerComponent extends SimpleComponentBase {
  constructor(obj, schema, key, path, status) {
    super(obj, schema, key, path, status);

    this.children.append(
      new TextInputLine(path+'.params.title', 'Überschrift', obj.params?.title),
      new TextInputLine(path+'.params.text', 'Text', obj.params?.text),
      new TextInputLine(path+'.params.plusPath', 'Link-Url', obj.params?.plusPath)
    );
  }
  
}

exports.view = PlusOpenerComponent;
exports.selectors = [
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'PLUS_OPENER',
  }
];

