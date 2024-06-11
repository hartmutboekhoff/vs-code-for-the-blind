const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');


class ContentConfigPanel extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, schema.title, obj.targetProperty, {class: 'component-panel'});
    this.top.append(new Element('p', {class:'min-max number'}))
      .children.append(new Element('label', schema.properties.minCount.title),
                       this.#getSpinner(obj.minCount, path+'.minCount',schema.properties.minCount.description),
                       new Element('label', schema.properties.maxCount.title),
                       this.#getSpinner(obj.maxCount, path+'.maxCount',schema.properties.maxCount.description));
    this.bottom.append(new OptionGroup(key, obj, schema, ['deduplicationId']));

    this.summary.add(`${prettyRange(obj.minCount, obj.maxCount)} Artikel`);
    obj.sources.forEach(s=>this.summary.add(s.type, s.count+' Artikel', getSourceParams(s.type,s.params), 'datasource'));
    if( obj.sources ) {
      const atypes = aggregateArticleTypes(...obj.sources);
      if( atypes != '' )
        this.summary.add('Artikeltypen', atypes);
    }
  }
  
  get preventSubElements() {
    return ['targetProperty', 'minCount', 'maxCount', 'deduplicationId'];
  }
  
  #getSpinner(value,path, description) {
    return new Element('input', {
      type: 'number',
      value: value,
      id: path,
      name: path,
      min: 0,
      step: 1,
      title: description ?? '',
    });
  }
  
}

exports.view = ContentConfigPanel;
exports.selectors = [
  {
    SchemaPath: '#.definitions.ContentConfig',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "PageConfigEditor"
  }
];

//  #/definitions/ContentConfigSource