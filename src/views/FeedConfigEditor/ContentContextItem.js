const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine, RadioInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper} = require('../helpers/dataElementViews');
const {getStringValuesList, getEnumLabel} = require('../helpers/utility');

class ContentContextItem extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, getEnumLabel(obj.publication.name, schema.properties.publication.properties.name.anyOf)?.title ?? obj.publication.name, obj.section.sectionUniqueName, {class:'feed-context match-'+status});

    this.children.append(
      new DropdownInputLine(path+'.publication.name', 
                        schema.properties?.publication.properties.name?.title ?? 'Publikation', 
                        obj.publication.name, schema.properties?.publication.properties.name.enum,
                        schema.properties?.publication.properties.name?.description
                       ),
      new TextInputLine(path+'.section.sectionUniqueName', 
                        schema.properties?.section.properties.sectionUniqueName?.title ?? 'Rubrik', 
                        obj.section.sectionUniqueName, 
                        schema.properties?.section.properties.sectionUniqueName?.description
                       )
    );
    this.collapsed = true;
  }
  
  get preventSubElements() {
    return true;
  }
}

exports.view = ContentContextItem;
exports.selectors = [
  {
    SchemaPath: '#.properties["$contentContext"].items',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "FeedConfigEditor"
  }
];

