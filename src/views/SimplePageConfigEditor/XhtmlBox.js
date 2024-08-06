const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine, CheckboxInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');
const {SimpleComponentBase} = require('../helpers/SimpleEditorComponent');


class XhtmlBoxComponent extends SimpleComponentBase {
  constructor(obj, schema, key, path, status) {
    super(obj, schema, key, path, status);

    this.setMainContentConfig('elements');
  }
  
  #addSummary(obj) {
    if( obj['$contentConfig'] ) {
      obj['$contentConfig'].forEach(cc=>{
        this.summary.add(
          cc.targetProperty,
          `${prettyRange(cc.minCount, cc.maxCount)} Artikel`,
          cc.sources.map(s=>`${s.type} (${s.count} Artikel)`).join(', ')
        );
      });
    
      const atypes = aggregateArticleTypes(...obj['$contentConfig'].map(cc=>cc.sources??[]).flat());
      if( atypes != '' )
        this.summary.add('Artikeltypen', atypes);
      
    }
    else if( obj.type == "BOX_HEADLINE" ) {
      this.summary.add('&Uumlberschrift', obj.params?.title);
    }
  }

  get preventSubElements() {
    return true;
  }
}

exports.view = XhtmlBoxComponent;
exports.selectors = [
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'XHTML_BOX',
  },
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'MULTI_BOX',
  }
];



