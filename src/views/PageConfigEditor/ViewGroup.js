const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine, RadioInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper} = require('../helpers/dataElementViews');
const {getStringValuesList} = require('../helpers/utility');

class ViewGroup extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, key, obj.id ?? path, {class:'view-group match-'+status});

    this.children.append(
      new TextInputLine(path+'.id', 
                        schema.properties?.id?.title ?? 'ID', 
                        obj.id, 
                        schema.properties?.id?.description
                       ),
      new RadioInputLine  (path+'.type', 
                           schema.properties?.type?.title ?? 'Typ', 
                           obj.type, 
                           getStringValuesList(schema.properties?.type?.enum, schema.properties?.type?.anyOf), 
                           schema.properties?.type?.description,
                           {class: 'view-group-type'}
                          )
    );
  }
  
  get preventSubElements() {
    return true;
  }
}

exports.view = ViewGroup;
exports.selectors = [
  {
    SchemaPath: '#.definitions.PageConfigViewGroup',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "PageConfigEditor"
  }
];

