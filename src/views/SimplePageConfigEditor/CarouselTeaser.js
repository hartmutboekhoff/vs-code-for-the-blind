const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');
const {SimpleComponentBase} = require('../helpers/SimpleEditorComponent')


class CarouselTeaserComponent extends SimpleComponentBase {
  constructor(obj, schema, key, path, status) {
    super(obj, schema, key, path, status);

    this.children.append(new TextInputLine(path+'.params.label', 'Link-Text', obj.params.label));
    this.children.append(new TextInputLine(path+'.params.fullPath', 'Link-Url', obj.params.fullPath));
    this.children.append(new TextInputLine(path+'.params.teaserType', 'Layout Variante', obj.params.teaserType));
    this.setMainContentConfig('teasers');
  }
  
}

exports.view = CarouselTeaserComponent;
exports.selectors = [
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'CAROUSEL_TEASER',
  }
];

