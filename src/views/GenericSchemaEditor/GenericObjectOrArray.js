const {TextInputLine, TextareaInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper} = require('../helpers/dataElementViews');

class GenericObjectOrArray extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, key, path, {class:(Array.isArray(obj)?'array':'object')+' match-'+status});
    if( path === '' ) this.classList.add('root');
    if( !['','properties','items'].includes(key) )
      this.children.append(new TextInputLine(path+'.title','Titel',obj.title),
                           new TextareaInputLine(path+'.description', 'Beschreibung', obj.description));
  }
  
  get preventSubElements() {
    return ['title', 'description'];
  }
}

exports.view = GenericObjectOrArray;
exports.selectors = [
  {
    SchemaPath: undefined,
    SchemaType: 'array',
    DataType: undefined,
    EditorType: undefined
  },
  {
    SchemaPath: undefined,
    SchemaType: 'object',
    DataType: undefined,
    EditorType: undefined
  },
  {
    SchemaPath: '#',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: undefined
  }
];
