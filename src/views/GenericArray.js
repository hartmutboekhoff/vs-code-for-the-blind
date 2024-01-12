const {Element} = require('../html');
const {ValueGroupWrapper} = require('./helpers/dataElementViews');

class GenericArray extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, schema.title??key, path, {class:'array generic deletable match-'+status});
  }
  
  get preventSubElements() {
    return false;
  }
}

exports.view = GenericArray;
exports.selectors = [
  {
    SchemaPath: undefined,
    SchemaType: 'array',
    DataType: undefined,
    EditorType: undefined
  }
];
