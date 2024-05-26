const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper} = require('../helpers/dataElementViews');


class ContentConfigPanel extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, schema.title, obj.targetProperty, {class: 'component-panel'});
    this.children.append(new Element('p', {class:'min-max number'}))
      .children.append(new Element('label', schema.properties.minCount.title),
                       this.#getSpinner(obj.minCount, path+'.minCount',schema.properties.minCount.description),
                       new Element('label', schema.properties.maxCount.title),
                       this.#getSpinner(obj.maxCount, path+'.maxCount',schema.properties.maxCount.description));
  }
  
  get preventSubElements() {
    return ['targetProperty', 'minCount', 'maxCount'];
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