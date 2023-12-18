const {TextInputLine, TextareaInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper} = require('../helpers/dataElementViews');

class Definition extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, key, path, {class: 'definition object match-'+status});
    this.id = '/'+path.replaceAll('.','/');
    
    this.children.append(new TextInputLine(path+'.title','Titel',obj.title),
                         new TextareaInputLine(path+'.description', 'Beschreibung', obj.description));
  }
  
  get preventSubElements() {
    return ['title', 'description'];
  }
}

exports.view = Definition;
exports.selectors = [
  {
    SchemaPath: '#.properties.definitions.additionalProperties',
    SchemaType: 'object',
    DataType: undefined,
    EditorType: undefined
  },
];
