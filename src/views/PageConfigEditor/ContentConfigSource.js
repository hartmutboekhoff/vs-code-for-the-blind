const {Element} = require('../../html');

class ContentConfigSource extends Element {
  constructor(obj, schema, key, path, status) {
    super('');
  }
  
  get preventSubElements() {
    return false;
  }
}

exports.view = ContentConfigSource;
exports.selectors = [
  {
    SchemaPath: '#.definitions.ContentConfig.properties.sources',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "PageConfigEditor"
  }
];

//  #/definitions/ContentConfigSource