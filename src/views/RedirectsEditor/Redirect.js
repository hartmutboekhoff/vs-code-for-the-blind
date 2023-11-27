//const {Element} = require('../html');
const {ValueGroupWrapper} = require('../helpers/dataElementViews');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');

class Redirect extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, key, obj.location.length>50?obj.location.slice(0,50)+'...':obj.location, {class:'redirect match-'+status});
    
    this.children.append(new TextInputLine(path+'--name','Quelle', key));
    this.children.append(new TextInputLine(path+'.location','Ziel', obj.location, schema.properties.location.description,{'view-path':path}));
    this.children.append(new TextInputLine(path+'.expiration','Gültig bis', obj.expiration, schema.properties.expiration.description,{'view-path':path}));
    
  }
  
  get preventSubElements() {
    return true;
  }
}

/*
function setValue(obj, relativePath, value) {
  if( relativePath.endsWith('--name')) {
    const oldkey = relativePath.slice(0,-6);
    const newKey = value;
    const actualValue = obj[oldKey];
    delete obj[oldkey];
    obj[newkey] = actualValue;
  }
  else if( relativePath.endsWith('--value') ) {
    obj[relativePath.slice(0,-7)] = value;
  }
}
*/

exports.view = Redirect;
exports.selectors = [
  {
    SchemaPath: '#.patternProperties["^\\/.*$"]',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: 'RedirectsEditor'
  }
];
