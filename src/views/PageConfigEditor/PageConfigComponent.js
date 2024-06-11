const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');


class ComponentLinkLabel extends Element {
  constructor(obj) {
    super('li', {class:'link-label'});
    this.children.append(
      new Element('input',{type:'text', class:'label',value:obj.title??obj.label}),
      new Element('input',{type:'text', class:'link',value:obj.fullPath})
    );
    if( obj.topicTags?.length > 0 )
      this.children.append(new Element('ul',{class:'link-label'}))
        .children.append(obj.topicTags.map(t=>new ComponentLinkLabel(t)));
  }
}
class TopicHeader extends Element {
  constructor(topicheader) {
    super('ul', {class:'link-label topic-header'});
    this.children.append(new Element('label','B&ouml;bbels'));
    this.children.append(new ComponentLinkLabel(topicheader));
  }
}
class ComponentTitle extends Element {
  constructor(obj) {
    super('ul', {class:'link-label component-title'});
    this.children.append(new Element('label', 'Titel'));
    this.children.append(new ComponentLinkLabel(obj));
  }
}

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
      this.summary.add('&Uumlberschrift', obj.title);
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

