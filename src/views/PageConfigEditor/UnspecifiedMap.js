const {Element, PlainText, Textarea} = require('../../html');
const {ValueGroupWrapper} = require('../helpers/dataElementViews');

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
    const tbl = new Element('table',{
      id: path,
    });
    this.children.append(tbl);
    
    tbl.children.append(new PlainText('<thead><tr><td>Name</td><td>Wert</td></tr></thead>'));
    let i = 0;
    for( const n in obj ) {
      const c1 = new Element('input', {
        type: 'input',
        value: n,
        name: `${path}--name`,
        'data-custom-change-handler': 'parent',
      });
      const c2 = new Textarea(obj[n],  {
        cols: 30,
        rows: 5, 
        name: `${path}--value`,
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

exports.view = UnspecifiedMap;
exports.selectors = [
  {
    SchemaPath: '#.definitions.UnspecifiedMap',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "PageConfigEditor"
  }
];

