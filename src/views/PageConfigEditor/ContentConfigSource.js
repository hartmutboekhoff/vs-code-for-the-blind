const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper} = require('../helpers/dataElementViews');


class ContentConfigSource extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, obj.type, '', {class: 'content-source'});
    let subtitle;
    switch( obj.type ) {
      case 'list':
        subtitle = obj.params?.listName 
                   ?? obj.params?.listNames?.join(', ') 
                   ?? '';
        break;
      case 'group':
        subtitle = obj.params?.groupName 
                   ?? obj.params?.groupNames?.join(', ') 
                   ?? '';
        break;
      case 'section':
        subtitle = obj.params?.sectionName 
                   ?? obj.params?.sectionNames?.join(', ') ?? obj.params.sectionUniqueName 
                   ?? obj.params?.sectionNames?.join(', ') 
                   ?? '';
        break;
    }
    this.subtitle.innerText =  subtitle? `${obj.count} Artikel (${subtitle})` : `${obj.count} Artikel`;
  }
  
  getSubkeys() {
    return ['count', 'params'];
  }
}

exports.view = ContentConfigSource;
exports.selectors = [
  {
    SchemaPath: '#.definitions.ContentConfigSource',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "PageConfigEditor"
  }
];

//  #/definitions/ContentConfigSource