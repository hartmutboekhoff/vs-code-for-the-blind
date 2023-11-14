const {Element} = require('../html');

class GenericBoolean extends Element {
  constructor(obj, schema, key, path, status) {
    super('p', {class:'boolean generic match-'+status});
    this.children.append(new Element('input', { 
      type: 'checkbox',
      id: path,
      name: path,
      checked: obj,
      title: schema.description,
    }));
    this.children.append(new Element('label', schema.title ?? key,{ 
      for: path,
    }));

    if( schema.description != undefined )
      this.children.append(new Element('span', schema.description, {
        class: 'description'
      }));
  }
  
  get preventSubElements() {
    return true;
  }
}

exports.view = GenericBoolean;
exports.selectors = [
  {
    SchemaPath: undefined,
    SchemaType: 'boolean',
    DataType: undefined,
    EditorType: undefined
  }
];

