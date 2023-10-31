const {Element} = require('../html');

class GenericString extends Element {
  constructor(obj, schema, key, path, status) {
    super('p', {class:'string generic match-'+status});
    this.children.append(new Element('label', key,{ 
      for: path,
    }));
    if( schema.enum != undefined ) {
      const select = new Element('select', {
        id: path,
        name: path,
        title: schema.description,
      });
      schema.enum.forEach(e=>{
        select.children.append(new Element('option', e, {
          value: e,
          selected: e==obj
        }));
      });
      this.children.append(select);
    }
    else {
      const input = new Element('input', { 
        type: 'text',
        id: path,
        name: path,
        value: obj,
        pattern: schema.pattern,
        minlength: schema.minLength,
        maxlength: schema.maxLength,
        title: schema.description,
      });  
      this.children.append(input);
    }
    if( schema.description != undefined )
      this.children.append(new Element('span', schema.description, {
        class: 'description'
      }));

  }
  
  get preventSubElements() {
    return true;
  }
}

exports.view = GenericString;
exports.selectors = [
  {
    SchemaPath: undefined,
    SchemaType: 'string',
    DataType: undefined,
    EditorType: "MenuEditor"
  }
];

