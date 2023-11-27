const {Element, PlainText, Textarea} = require('../../html');
const {ValueGroupWrapper} = require('../helpers/dataElementViews');
const {buildJsonPath,renameObjectProperty} = require('../../utility');

class TableRow extends Element {
  constructor(...content) {
    super('tr')
    for( const c of content ) {
      const td = new Element('td');
      if( c != undefined ) td.children.append(c);
      this.children.append(td);
    }
  }
}

class UnspecifiedMap extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, key, path, {class:'unspecified-map match-'+status});
    this.viewPath = path;
    const tbl = new Element('table',{
      id: path,
    });
    this.children.append(tbl);
    
    tbl.children.append(new PlainText('<thead><tr><td>Name</td><td>Wert</td></tr></thead>'));
    let i = 0;
    for( const n in obj ) {
      const fieldName = buildJsonPath(path,n);
      const c1 = new Element('input', {
        type: 'input',
        value: n,
        name: `${fieldName}--name`,
        'data-custom-change-handler': 'parent',
      });
      
      const text = typeof obj[n] == 'object'? JSON.stringify(obj[n],undefined,2) : obj[n];
      let lnCount = text?.match?.(/\n/g)?.length ?? 0;
      const c2 = new Textarea(text,  {
        cols: 50,
        rows: ++lnCount<3? 3 : lnCount>20? 20 : lnCount, 
        name: `${fieldName}--value`,
        'data-custom-change-handler': 'parent',
      });
      tbl.children.append(new TableRow(c1, c2));
      ++i;
    }




    if( schema.description != undefined )
      this.children.append(new Element('span', schema.description, {
        class: 'description',
      }));
  }
  
  get preventSubElements() {
    return true;
  }
}

function setValue(obj, relativePath, value) {
  if( relativePath.endsWith('--name')) {
    const oldKey = relativePath.slice(0,-6);
    const newKey = value;
    return renameObjectProperty(obj, oldKey, newKey);
  }
  else if( relativePath.endsWith('--value') ) {
    obj[relativePath.slice(0,-7)] = value;
  }
  return obj;
}
 
exports.view = UnspecifiedMap;
exports.setValue = setValue;
exports.selectors = [
  {
    SchemaPath: '#.definitions.UnspecifiedMap',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "PageConfigEditor"
  }
];

