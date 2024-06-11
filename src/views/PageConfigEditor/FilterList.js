const {Element} = require('../../html');
const {getStringValuesList} = require('../helpers/utility');
const {toNiceText} = require('../../utility');
const {EnumValueArray} = require('../helpers/dataElementViews')

function transformObj2Str(objArray) {return objArray?.map(o=>o.type);}
function transformStr2Obj(strArray) {return strArray?.map(s=>({type:s}));}
function transformSchemaObj2Str(schema) {
  return {
    type: 'array',
    items: schema.items.properties.type
  };
}    
function transformSchemaStr2Obj(schema) {
  return {
    type: 'array',
    item: {
      type: 'object',
      properties: {
        type: schema.items
      }
    }
  };
}    

 
class FilterList extends EnumValueArray {
  constructor(obj, schema, key, path, status) {
    super(transformObj2Str(obj), transformSchemaObj2Str(schema), path, schema.title??'Artikeltypen', {class:'source-filters match-'+status});
  }

  get preventSubElements() {
    return true;
  }
}

function setValue(obj, relativePath, value) {
  console.log('setting value', {obj, relativePath, value});
  return obj;
}

exports.view = FilterList;
exports.setValue = setValue;
exports.selectors = [
  {
    SchemaPath: '#.definitions.ContentConfigSource.properties.filters',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "PageConfigEditor"
  }
];

