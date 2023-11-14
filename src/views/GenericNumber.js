const {Element} = require('../html');

class GenericNumber extends Element {
  #obj; #schema; #key; #path;

// minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf
  
  constructor(obj, schema, key, path, status) {
    super('p', {class:'number generic match-'+status});
    
    this.#obj = obj;
    this.#schema = schema;
    this.#key = key;
    this.#path = path;
    
    this.children.append(new Element('label', schema.title ?? key,{ 
      for: path,
    }));
    
    this.children.append(this.#getSpinner());

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
      pattern: '[+-]?\d*(,\d*)?',
      title: this.#schema.description,
    });
  }
  #getRange() {
    return new Element('input', { 
      type: 'range',
      id: this.#path,
      name: this.#path,
      value: this.#obj,
      min: this.#schema.minimum ?? this.#schema.exclusiveMinimum,
      max: this.#schema.maximum ?? this.#schema.exclusiveMaximum,
      step: this.#schema.multipleOf,
      title: this.#schema.description,
    });
  }
  #getSpinner() {
    return new Element('input', {
      type: 'number',
      value: this.#obj,
      id: this.#path,
      name: this.#path,
      min: this.#schema.minimum ?? this.#schema.exclusiveMinimum,
      max: this.#schema.maximum ?? this.#schema.exclusiveMaximum,
      step: this.#schema.multipleOf,
      title: this.#schema.description,
    });
  }

  
  get preventSubElements() {
    return true;
  }
}

exports.view = GenericNumber;
exports.selectors = [
  {
    SchemaPath: undefined,
    SchemaType: 'number',
    DataType: undefined,
    EditorType: undefined
  },
  {
    SchemaPath: undefined,
    SchemaType: 'integer',
    DataType: undefined,
    EditorType: undefined
  }
];

