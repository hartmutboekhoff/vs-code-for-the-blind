const {Element, BR} = require('../../html');
const {getStringValuesList} = require('../helpers/utility');
const {toNiceText} = require('../../utility');
const {EnumValueArray} = require('../helpers/dataElementViews')


const SimpleFilters = [
    "default",
    "defaultWithoutNoIndex",
    "nonFuture",
    "nonLive",
    "premium",
    "free",
    "nonTest",
    "noIndex",
    "hasTeaserImage",
    "nothing",
    "hasPlayout",
    "notOnIndexPage"
];
const DateFilters = [
    "excludeOwnerPublications"
];
const PublicationFilters = [
    "timePeriod"
];

 
 
class FilterList extends Element {
  #obj; #schema; #path;
  
  constructor(obj, schema, key, path, status) {
    super('div', {class:'enum-array filter-list match-'+status});
    this.#obj = obj;
    this.#schema = schema;
    this.#path = path;

    this.children.append(new Element('label', schema.title ?? 'Filter', {'for':path+'--array'}));
    const ul = this.children.append(new Element('ul', {tabindex:0}));
    
    ul.children.append(
      ...SimpleFilters.map(f=>this.#simpleFilter(f)),
      ...DateFilters.map(f=>this.#dateFilter(f)),
      ...PublicationFilters.map(f=>this.#publicationsFilter(f))
    );
  } 

  #simpleFilter(filterType) {
    const id = this.#path+'.'+filterType;
    const checked = this.#obj.find(i=>i.type==filterType)? true : false;
    const {const:label,description} = this.#schema.items.properties.type.anyOf?.find(i=>i.const==filterType) ?? {const:toNiceText(filterType)}
    const li = new Element('li', {class:'enum-value simple'});
    li.children.append(new Element('input',{type:'checkbox',id, name: id, checked}),
                       new Element('label', label, {'for':id, title: description}));
    return li;    
  }
  #dateFilter(filterType) {
    const dateInput=(dateKey)=>{
      const fieldId = id+'--'+dateKey;
      const span = new Element('span');
      span.children.append(
        new Element('label', this.#schema.items.properties.params.properties[dateKey].title ?? toNiceText(dateKey), {for:fieldId}),
        new Element('input', {type:'text', id:fieldId, name:fieldId, value:value?.params?.[dateKey]})
      );
      return span;
    }
    const id = this.#path+'.'+filterType;
    const value = this.#obj.find(i=>i.type==filterType);
    const {const:label,description} = this.#schema.items.properties.type.anyOf?.find(i=>i.const==filterType) ?? {const:toNiceText(filterType)};
    
    const li = new Element('li', {class:'enum-value simple'});
    li.children.append(new Element('input',{type:'checkbox',id, name: id, checked: !!value}),
                       new Element('label', label, {'for':id, title: description}),
                       dateInput('startDate'),
                       dateInput('endDate'));
    const ul = new Element('ul');
    ul.children.append(new BR, li);
    return ul;
  }
  #publicationsFilter(filterType) {
    const publicationInput=()=>{
      const fieldId = id+'--publications'
      const pubs = value?.params?.publicationNames?.join(', ');
      return new Element('input', {type:'text', id:fieldId, value:pubs});
    }
    
    const id = this.#path+'.'+filterType;
    const value = this.#obj.find(i=>i.type==filterType);
    const {const:label,description} = this.#schema.items.properties.type.anyOf?.find(i=>i.const==filterType) ?? {const:toNiceText(filterType)};
    
    const li = new Element('li', {class:'enum-value simple'});
    li.children.append(new Element('input',{type:'checkbox',id, name: id, checked: !!value}),
                       new Element('label', label, {'for':id, title: description}),
                       publicationInput());
    const ul = new Element('ul');
    ul.children.append(new BR, li);
    return ul;
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

