const {Element} = require('../html');
const {getStringValuesList} = require('./helpers/utility.js');

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
    
    if( schema.enum == undefined ) {
      this.children.append(this.#getTextInput());
    }
    else {
      const values = getStringValuesList(schema.enum,schema.anyOf);
      if( values.length < 5 )
        this.children.append(...this.#getRadioButtons(values));
      else
        this.children.append(this.#getDropdown(values));
    }
    
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
  #getDropdown(values) {
    const select = new Element('select', {
      id: this.#path,
      name: this.#path,
      title: this.#schema.description,
    });
    for( const v of values ) {
      select.children.append(new Element('option', v.title ?? v.const, {
        value: v.const,
        selected: v.const==this.#obj,
        title: v.description
      }));
    }
    return select;
  }
  #getRadioButtons(values) {
    return values.map(v=>{
      return [new Element('input', {
        type: 'radio',
        value: v.const,
        id: this.#path+'--'+v.const,
        name: this.#path,
        checked: this.#obj == v.const,
      }),
      new Element('label', v.title ?? v.const, {
        for: this.#path+'--'+v.const
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
  },
  {
    SchemaPath: undefined,
    SchemaType: undefined,
    DataType: 'string',
    EditorType: undefined
  }
];

