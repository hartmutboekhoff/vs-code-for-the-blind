const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper} = require('../helpers/dataElementViews');

class PageConfigComponent extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, key, obj.type ?? path, {class:'page-content-component match-'+status});

    //this.children.append(new TextInputLine(path+'.type', schema.properties?.type?.title ?? 'Typ', obj.type, schema.properties?.type?.description));
  }
  
  get preventSubElements() {
    return false;
  }
}

exports.view = PageConfigComponent;
exports.selectors = [
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "PageConfigEditor"
  }
];

