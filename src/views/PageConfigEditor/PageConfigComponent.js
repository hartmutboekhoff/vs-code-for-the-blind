const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');
const {ComponentLinkLabel, TopicHeader, ComponentTitle} = require('../helpers/ComponentParts');



class PageConfigComponent extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, key, obj.type ?? path, {class:'page-content-component match-'+status});
    if( obj.enabled === false ) this.classList.add('disabled');

    this.#addSummary(obj);
    this.#addLabels(obj);

    this.bottom.append(new OptionGroup(key, obj, schema, [
      'hideWithoutContent',
      'viewGroupId'
    ]));
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
  #addLabels(obj) {
    if( obj.params?.topicHeader ) 
      this.bottom.append(new TopicHeader(obj.params.topicHeader));
    else if( obj.params )
      this.top.append(new ComponentTitle(obj.params));
  }

  get preventSubElements() {
    return ['type','hideWithoutContent','viewGroupId'];
  }
}

exports.view = PageConfigComponent;
exports.selectors = [
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "PageConfigEditor"
  }
];

