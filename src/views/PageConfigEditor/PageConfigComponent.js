const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');

class PageConfigComponent extends ValueGroupWrapper {
  #childFrame;
  
  constructor(obj, schema, key, path, status) {
console.log('komponente', key==undefined);
    super(schema, key, obj.type ?? path, {class:'page-content-component match-'+status});
console.log(key);
    this.#childFrame = super.children.append(new Element(''));
    super.children.append(new OptionGroup(key, obj, schema, [
      'hideWithoutContent',
      'viewGroupId',
      
    ]));
    super.children.append(new Element('h1','funktionert'));

console.log(key);
    //this.children.append(new TextInputLine(path+'.type', schema.properties?.type?.title ?? 'Typ', obj.type, schema.properties?.type?.description));
  }

  get children() {
    return this.#childFrame?.children ?? super.children;
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

