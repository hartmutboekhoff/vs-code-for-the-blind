//const {Element} = require('../html');
const {ValueGroupWrapper} = require('./helpers/dataElementViews');

class GenericObjectOrArray extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, schema.title??key, path, {class:(Array.isArray(obj)?'array':'object')+' generic deletable match-'+status});
  }
  
  get preventSubElements() {
    return false;
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
  }
];
