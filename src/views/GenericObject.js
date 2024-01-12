const {Element} = require('../html');
const {ValueGroupWrapper} = require('./helpers/dataElementViews');

class GenericObject extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, schema.title??key, path, {class:'object generic  match-'+status});
  }
  
  get preventSubElements() {
    return false;
  }
}

exports.view = GenericObject;
exports.selectors = [
  {
    SchemaPath: undefined,
    SchemaType: 'object',
    DataType: undefined,
    EditorType: undefined
  }
];
