const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, PopupValueGroupWrapper} = require('../helpers/dataElementViews');
const {getEnumLabel} = require('../helpers/utility');
const {DataSourceBase} = require('../helpers/DataSourceBase');


class GroupSource extends DataSourceBase {
  constructor(obj, schema, key, path, status) {
    super(obj, schema, key, path, status);
    
    this.title = 'Gruppe'
    this.subtitle =  obj.params?.groupName ?? obj.params?.groupNames?.join(', ') ?? '';
    this.classList.add('group');

    this.summary.add('Gruppe', obj.params?.groupName ?? obj.params?.groupNames?.join(', ') ?? '', undefined, undefined, .5);

  }
  
  getSubkeys() {
    return ['count', 'params', 'filters'];
  }
}

exports.view = GroupSource;
exports.selectors = [
  {
    SchemaPath: '#.definitions.ContentConfigSource',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "PageConfigEditor",
    ComponentType: "group"
  }
];

//  #/definitions/ContentConfigSource