//const {Element} = require('../html');
const {ValueGroupWrapper} = require('../helpers/dataElementViews');
const {TextInputLine, DropdownInputLine, NumericInputLine} = require('../../htmlFormFields');

class Redirect extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, key, obj.location.length>50?obj.location.slice(0,50)+'...':obj.location, {class:'redirect collapsed match-'+status});
    
    this.children.append(new TextInputLine(path+'--name','Quelle', key));
    this.children.append(new TextInputLine(path+'.location','Ziel', obj.location, schema.properties.location.description,{'view-path':path}));
    this.children.append(new NumericInputLine(path+'.expiration','Gültig bis', obj.expiration, schema.properties.expiration.description,{'view-path':path}));
  }
  
  get preventSubElements() {
    return true;
  }
}

function setValue(obj, relativePath, value) {
  switch( relativePath ) {
    case 'expiration': 
      value = +value;
  }
  obj[relativePath] = value;
  return obj;
}

exports.view = Redirect;
exports.setValue = setValue;
exports.selectors = [
  {
    SchemaPath: '#.patternProperties["^\\/.*$"]',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: 'RedirectsEditor'
  }
];
