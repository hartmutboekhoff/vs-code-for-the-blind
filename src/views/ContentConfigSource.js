const {Element} = require('../html');
const {TextInputLine, DropdownInputLine} = require('../htmlFormFields');
const {ValueGroupWrapper} = require('./helpers/dataElementViews');
const {getEnumLabel} = require('./helpers/utility');


class ContentConfigSource extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, obj.type, '', {class: 'content-source'});
    this.summary.add(obj.count+' Artikel');
    if( obj.params ) {
      this.summary.add('Publikation',obj.params.publicationName??'aktuelle Publikation');
      this.summary.add('Rubrik', obj.params?.sectionName ?? obj.params?.sectionNames?.join(', ') ?? obj.params.sectionUniqueName ?? '');
    }

    switch( obj.type ) {
      case 'list':
        this.summary.add('Liste',obj.params?.listName ?? obj.params?.listNames?.join(', ') ?? '');
        break;
      case 'group':
        this.summary.add('Gruppe', obj.params?.groupName ?? obj.params?.groupNames?.join(', ') ?? '');
        break;
        
      case 'section':
      default:
    }

    if( obj.params?.articleTypes ) 
      this.summary.add('Artikeltypen', obj.params.articleTypes.join(', '));
    if( obj.filters )
      this.summary.add('Filter', obj.filters.map(f=>f.type).join(', '));

  }
  
  getSubkeys() {
    return ['count', 'params', 'filters'];
  }
}

exports.view = ContentConfigSource;
exports.selectors = [
  {
    SchemaPath: '#.definitions.ContentConfigSource',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "PageConfigEditor"
  },
  {
    SchemaPath: '#.definitions.ContentConfigSource',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "FeedConfigEditor"
  }
];

//  #/definitions/ContentConfigSource