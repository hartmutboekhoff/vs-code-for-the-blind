const {Element} = require('../../html');
//const {MultiSelectInputLine} = require('../../htmlFormFields');
const {getStringValuesList} = require('../helpers/utility');
const {toNiceText} = require('../../utility');

class ArticleTypeList extends Element {
  constructor(obj, schema, key, path, status) {
    super('div',{id:path,class:'article-types'});
    this.children.append(new Element('label', schema.title??'Artikeltypen', {'for':path+'--list'}));
    const ul = new Element('ul', {class:'article-type-list', tabinde:0});
    const articletypes = getStringValuesList(schema.items.enum, schema.items.anyOf);
    for( const atype of articletypes ) {
      const li = new Element('li',{class:'article-type'});
      li.children.append(new Element('input',{type:'checkbox',id:path+'.'+atype.const, name: path, checked: obj.includes(atype.const)}),
                         new Element('label', atype.title??toNiceText(atype.const),{'for':path+'.'+atype.const,title: atype.description}));
      ul.children.append(li);
    }
    this.children.append(ul);
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

