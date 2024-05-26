const {Element} = require('../html');

class FlattenedArray extends Element {
  constructor(obj, schema, key, path, status) {
    super('');
  }
  
  get preventSubElements() {
    return false;
  }
}

exports.view = FlattenedArray;
exports.selectors = [
  {
    SchemaPath: '#.definitions.ContentConfig.properties.sources',
    SchemaType: 'array',
    DataType: 'array',
    EditorType: "PageConfigEditor"
  },
  {
    SchemaPath: '#.definitions.PageConfigComponent.properties["$contentConfig"]',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "PageConfigEditor"
  }
];

//  #/definitions/ContentConfigSource