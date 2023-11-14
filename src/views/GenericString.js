const {Element} = require('../html');

class GenericString extends Element {
  #obj; #schema; #key; #path;
  
  constructor(obj, schema, key, path, status) {
    super('p', {class:'string generic match-'+status});
    
    this.#obj = obj;
    this.#schema = schema;
    this.#key = key;
    this.#path = path;
    
    this.children.append(new Element('label', schema.title ?? key,{ 
      for: path,
    }));
    
    if( schema.enum == undefined )
      this.children.append(this.#getTextInput());
    else if( schema.enum.length < 5 )
      this.children.append(...this.#getRadioButtons());
    else
      this.children.append(this.#getDropdown());
    
    if( schema.description != undefined )
      this.children.append(new Element('span', schema.description, {
        class: 'description'
      }));

  }
  
  #getTextInput() {
    return new Element('input', { 
      type: 'text',
      id: this.#path,
      name: this.#path,
      value: this.#obj,
      pattern: this.#schema.pattern,
      minlength: this.#schema.minLength,
      maxlength: this.#schema.maxLength,
      title: this.#schema.description,
    });
  }
  #getDropdown() {
    const select = new Element('select', {
      id: this.#path,
      name: this.#path,
      title: this.#schema.description,
    });
    this.#schema.enum.forEach(e=>{
      select.children.append(new Element('option', e, {
        value: e,
        selected: e==this.#obj
      }));
    });
    return select;
  }
  #getRadioButtons() {
    return this.#schema.enum.map(e=>{
      return [new Element('input', {
        type: 'radio',
        value: e,
        id: this.#path+'--'+e,
        name: this.#path,
        checked: this.#obj == e,
      }),
      new Element('label', e, {
        for: this.#path+'--'+e
      })];
    }).flat();    
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
    EditorType: undefined
  }
];

