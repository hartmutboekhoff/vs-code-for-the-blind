const {Element} = require('../../html');
const {getStringValuesList} = require('../helpers/utility');
const {toNiceText} = require('../../utility');
const {EnumValueArray} = require('../helpers/dataElementViews')

class ArticleTypeList extends EnumValueArray {
  constructor(obj, schema, key, path, status) {
    super(obj, schema, path, schema.title??'Artikeltypen', {class:'article-types match-'+status});
  }
  
  get preventSubElements() {
    return true;
  }
}

exports.view = ArticleTypeList;
exports.selectors = [
  {
    SchemaPath: '#.definitions.ArticleTypeList',
    SchemaType: undefined,
    DataType: undefined,
    EditorType: "PageConfigEditor"
  }
];

