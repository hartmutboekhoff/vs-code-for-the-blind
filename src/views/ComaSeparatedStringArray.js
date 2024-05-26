const {Element} = require('../html');
const {getStringValuesList} = require('./helpers/utility.js');

class CommaSeparatedStringArray extends Element {
  #obj; #schema; #key; #path; #stringValue;
  
  constructor(obj, schema, key, path, status) {
    super('p', {class:'string match-'+status});
    
    this.#obj = obj;
    this.#schema = schema;
    this.#key = key;
    this.#path = path;
    
    this.children.append(new Element('label', schema.title ?? key,{ 
      for: path,
    }));
    
    if( this.#obj.every(s=>typeof s == 'string') ) {
      if( this.#obj.every(s=>!s.includes(', ')) )
        this.#stringValue = this.#obj.join(', ');
      else
        this.#stringValue = this.#obj.map(s=>'"'+s.replace('\\', '\\\\').replace('"', '\\"')+'"').join(', ');
        
      this.children.append(new Element('input', { 
        type: 'text',
        id: this.#path,
        name: this.#path,
        value: this.#stringValue,
        title: this.#schema.description,
      }));
    }
    else {
      this.children.append(new Element('span', this.#obj.join(', '), {'class': 'error'}));
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

exports.view = CommaSeparatedStringArray;
exports.selectors = [
  {
    SchemaPath: /.*\.groupNames$/,
    SchemaType: 'array',
    DataType: 'array',
    EditorType: undefined
  },
  {
    SchemaPath: /.*\.listNames$/,
    SchemaType: 'array',
    DataType: 'array',
    EditorType: undefined
  },
  {
    SchemaPath: /.*\.sectionUniqueNames$/,
    SchemaType: 'array',
    DataType: 'array',
    EditorType: undefined
  }
];

