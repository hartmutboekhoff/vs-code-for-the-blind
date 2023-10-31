const {Element} = require('../html');
const {TextInputLine, DropdownInputLine} = require('../htmlFormFields');

class MenuItem extends Element {
  constructor(obj, schema, key, path, status) {
    super('fieldset',{class:'menu-item'});
    this.children.append(new Element('legend', key+' - '+path));

    this.children.append(new TextInputLine(path+'.label','Titel', obj.label, schema.properties.label.description));
    this.children.append(new TextInputLine(path+'.path','Pfad', obj.path, schema.properties.path.description));
    this.children.append( new DropdownInputLine(path+'.type', 'Typ', obj.type, schema.properties.type.enum, schema.properties.type.description));
  }
  
  get preventSubElements() {
    return ['label', 'path', 'type'];
  }
}

exports.view = MenuItem;
exports.selectors = [
/*
  {
    SchemaPath: '#.definitions.navArray',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "MenuEditor"
  },
*/  
  {
    SchemaPath: '#.definitions.navItem',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "MenuEditor"
  }
];

