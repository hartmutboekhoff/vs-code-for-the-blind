const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {MinMaxCount} = require('../helpers/ComponentParts');
const {ValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');
const {SimpleComponentBase} = require('../helpers/SimpleEditorComponent')


class VariableListBoxComboComponent extends SimpleComponentBase {
  constructor(obj, schema, key, path, status) {
    const addColumnOptions=(label, contentConfigKey, paramKey)=>{
      this.children.append(new Element('fieldset')).children.append(
        new Element('legend', label),
        new TextInputLine(path+'.params.'+paramKey+'.title','Titel', obj.params[paramKey].title),
        new TextInputLine(path+'.params.'+paramKey+'variant','LayoutVariante', obj.params[paramKey].tvariant),
        new MinMaxCount(undefined, obj.$contentConfig[contentConfigKey], path+'.$contentConfig['+contentConfigKey+']')
      )
    }



    super(obj, schema, key, path, status);
    addColumnOptions('Links', obj.$contentConfig.findIndex(c=>c.targetProperty=='left.teasers'), 'left');
    addColumnOptions('Mitte', obj.$contentConfig.findIndex(c=>c.targetProperty=='center.teasers'), 'center');
    addColumnOptions('Rechts', obj.$contentConfig.findIndex(c=>c.targetProperty=='right.teasers'), 'right');
    
  }
  
}

exports.view = VariableListBoxComboComponent;
exports.selectors = [
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'VARIABLE_LIST_BOX_COMBO',
  }
];

