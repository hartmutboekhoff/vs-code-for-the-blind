const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine, CheckboxInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, OptionGroup} = require('./dataElementViews');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('./utility');
const {MinMaxCount} = require('./ComponentParts');

class SimpleComponentBase extends ValueGroupWrapper {
  #obj; #path;
  
  constructor(obj, schema, key, path, status) {
    super(schema, key, obj.type ?? path, {class:'page-content-component match-'+status});
    this.#obj = obj;
    this.#path = path;
    
    if( obj.enabled === false ) this.classList.add('disabled');
    this.summary.allwaysVisible = true;

    this.#addSummary(obj);
    this.top.append(new CheckboxInputLine(path+'.enabled', 'Aktiv', obj.enabled??true));
    
  }

  setMainContentConfig(name, label) {
    const contentConfig = !this.#obj.$contentConfig
      ? undefined
      : name != undefined
      ? this.#obj.$contentConfig.find(c=>c.targetProperty==name)
      : this.#obj.$contentConfig.length == 1
      ? this.#obj.$contentConfig[0]
      : undefined;
      
    if( contentConfig )
      this.children.append(new MinMaxCount(undefined,contentConfig,this.#path, label));
    if( this.#obj.$contentConfig?.length > 0 )     
      this.top.append(new CheckboxInputLine(this.#path+'.hideWithoutContent', 'Nur anzeigen, wenn Ihnalte vorhanden sind', this.#obj.hideWithoutContent??false));

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

module.exports = {
  SimpleComponentBase
};
