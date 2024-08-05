const {Element} = require('../../html');
const {TextInput, TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, OptionGroup} = require('../helpers/dataElementViews');
const {TopicHeader} = require('../helpers/ComponentParts');
const {getSourceParams, prettyRange, aggregateArticleTypes} = require('../helpers/utility');
const {SimpleComponentBase} = require('../helpers/SimpleEditorComponent')


class NncTextCtaInfoBoxComponent extends SimpleComponentBase {
  constructor(obj, schema, key, path, status) {
    super(obj, schema, key, path, status);

    this.children.append(new TextInputLine(obj.path+'.params.title', 'Überschrift', obj.params.title));   
    this.children.append(new TextInputLine(obj.path+'.params.text', '1. Textzeile', obj.params.text));   
    if( obj.params.textList )
      this.children.append(obj.params.textList.map((t,ix)=>new TextInputLine(`${path}.params.textList[${ix}]`, '', t)));

    this.children.append(new Element('fieldset'))
      .children.append(
        new Element('legend', 'Primärer Link'),
        new TextInputLine(path+'params.linkPrimary.label','Beschriftung',obj.params.linkPrimary?.label??''),
        new TextInputLine(path+'params.linkPrimary.fullPath','Link-Url',obj.params.linkPrimary?.fullPath??''),
        new TextInputLine(path+'params.linkPrimary.target','Zielfenster',obj.params.linkPrimary?.target??'')
      );


    
  }
  
}

exports.view = NncTextCtaInfoBoxComponent;
exports.selectors = [
  {
    SchemaPath: '#.definitions.PageConfigComponent',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "SimplePageConfigEditor",
    ComponentType: 'NNC_TEXT_CTA_INFOBOX',
  }
];





