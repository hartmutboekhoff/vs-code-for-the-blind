const {TextInputLine, TextareaInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper} = require('../helpers/dataElementViews');

const IGNORED_PROPERTIES = ['','properties','items','if','then','else','enum', 'definitions','examples'];

class GenericObjectOrArray extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, key==''?schema.title:key??schema.title, path, {class:(Array.isArray(obj)?'array':'object')+' match-'+status});
    if( path === '' ) this.classList.add('root');
    
    if( IGNORED_PROPERTIES.includes(key) ) return;
    if( '$ref' in obj ) return;
    
    this.children.append(new TextInputLine(path+'.title','Titel',obj.title),
                         new TextareaInputLine(path+'.description', 'Beschreibung', obj.description),
                         new TextInputLine(path+'.$comment','$comment',obj.$comment));
  }
  
  get preventSubElements() {
    return ['title', 'description','$$comment'];
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
    DataType: 'object',
    EditorType: undefined
  }
];
