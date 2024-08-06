const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine, CheckboxInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');
const {SimpleComponentBase} = require('../helpers/SimpleEditorComponent');

class OnOffOnlyComponent extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, key, obj.type ?? path, {class:'page-content-component match-'+status});
    this.classList.add('compact', 'not-collapsible');
    this.children.append(new CheckboxInputLine(path+'.enabled', 'Aktiv', obj.enabled??true));
  }
  
  get preventSubElements() {
    return true;
  }
  preRender() {
    this.collapsed = false;
  }
}

exports.view = OnOffOnlyComponent;
exports.selectors = [
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'LETTER_GROUP',
  },
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'TOPIC_SELECTION'
  },
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'NEWSLETTER_SIGNUP'
  },{
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'INDEX_SUBNAVIGATION'
  },
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'NNC_MULTILINK_CONTACTBOX'
  },
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'CAROUSEL_HAPPY_NEWS_TEASER'
  },
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'TAGS_BOX'
  },
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'LETTER_GROUP_LIST'
  },
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'TEXTLINK_BOX'
  }
];



