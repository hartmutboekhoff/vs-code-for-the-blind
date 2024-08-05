const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');
const {SimpleComponentBase} = require('../helpers/SimpleEditorComponent')


class BoxHeadlineComponent extends SimpleComponentBase {
  constructor(obj, schema, key, path, status) {
    super(obj, schema, key, path, status);

    this.children.append(
      new TextInputLine(path+'.params.title', 'Titel', obj.params?.title),
      new TextInputLine(path+'.params.level', 'Überschriftenebene', obj.params?.level),
      new TextInputLine(path+'.params.variant', 'Layout-Variante', obj.params?.variant)
    );
  }
  
}

exports.view = BoxHeadlineComponent;
exports.selectors = [
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'BOX_HEADLINE',
  }
];

