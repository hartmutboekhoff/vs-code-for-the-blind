const {Element} = require('../../html');
const {Legend, TextInputLine, DropdowInputLine, CheckboxInputLine, NumericInputLine} = require('../../htmlFormFields');
const {prepareDropdownOptions, toNiceText} = require('../../utility');
const {getStringValuesList} = require('./utility');
//require('../../dev/Array.prototype.log');

class ValueGroupWrapper extends Element {
  #title; #subtitle; #top; #main; #bottom; #summary;
  #childrenContainer;
  #collapseChildren = 0;
  
  constructor(schema, title, subtitle, attributes) {
    if( typeof subtitle == 'object' && attributes == undefined ) [subtitle,attributes] = ['', subtitle];
    super('fieldset', Object.assign({title:schema.description},attributes));

    this.#title = new Element('span', title??schema.title);
    this.#subtitle = new Element('span', subtitle, {class:'description'});
    this.#summary = new Summary();    
    this.#top = new Element('');
    this.#main = new Element('');
    this.#bottom = new Element('');

    this.#childrenContainer = this.arrangeChildren(this.#title, this.#subtitle, this.#summary, this.#top, this.#main, this.#bottom);
  }
  arrangeChildren(title,subtitle,summary,top,main,bottom) {
    this.children.append(new Element('legend'))
        .children.append(new Element('span',{class:'collapse-button'}),
                         new Element('span', {class:'match-marker'}),
                         title, subtitle);
    this.children.append(summary, top, main, bottom);
    return main;
  }

  get title() {
    return this.#title;
  } 
  set title(v) {
    if( typeof v == 'string' )
      this.#title.children.append(v);
    else if( Array.isArray(v) )
      this.#title.children.append(...v.filter(e=>typeof e == 'string'))
  } 
  get subtitle() {
    return this.#subtitle;
  }
  set subtitle(v) {
    if( typeof v == 'string' )
      this.#subtitle.children.append(v);
    else if( Array.isArray(v) )
      this.#subtitle.children.append(...v.filter(e=>typeof e == 'string'))
  } 
  get children() {
    return this.#childrenContainer?.children ?? super.children;
  }
  get top() {
    return this.#top?.children;
  }
  get bottom() {
    return this.#bottom?.children;
  }
  get summary() {
    return this.#summary;
  }
  get viewPath() { 
    return this.attributes['view-path']; 
  }
  set viewPath(v) { 
    if( v == undefined || v.trim() == '' )
      delete this.attributes['view-path'];
    else
      this.attributes['view-path'] = v; 
  }
  get collapsed() {
    return this.classList.has('collapsed');
  }
  set collapsed(v) {
    if( v )
      this.classList.add('collapsed');
    else
      this.classList.remove('collapsed');
  }
  get collapseChildren() {
    return this.#collapseChildren;
  }
  set collapseChildren(depth) {
    this.#collapseChildren = depth==true? Infinity : depth==false? 0 : +depth==NaN? 0 : +depth;
  }
  
  preRender() {
    function collapseChildren(children, depth) {
      children.forEach(c=>{
        if( c instanceof ValueGroupWrapper ) {
          c.collapsed = true;
          if( depth > 0 ) {
            collapseChildren(c.children, depth-1);
            collapseChildren(c.top, depth-1);
            collapseChildren(c.bottom, depth-1);
          }
        }
        else if( c instanceof Element ) {
          collapseChildren(c.children, depth);
        }
      });
    }
         
    if( this.#collapseChildren > 0 ) {
      collapseChildren(this.children, this.#collapseChildren-1);
      collapseChildren(this.top, this.#collapseChildren-1);
      collapseChildren(this.bottom, this.#collapseChildren-1);
    }
  }
}
class PopupValueGroupWrapper extends ValueGroupWrapper {
  constructor(schema, title, subtitle, attributes) {
    super(schema, title, subtitle, attributes);
    this.classList.add('collapsed');
  }
  arrangeChildren(title,subtitle,summary,top,main,bottom) {
    const legend = new Element('legend');
    legend.children.append(new Element('span', {class:'collapse-button popup'}),
                           new Element('span', {class:'match-marker'}),
                           title, subtitle);
    const overlay = new Element('div',{class:'overlay'});
    const popup = new Element('fieldset', {class:'popup'});
    overlay.children.append(popup);
    popup.children.append(legend, top, main, bottom);

    this.children.append(legend, summary, overlay);
    return main;
  }
}

class EnumValueArray extends Element {
  constructor(obj, schema, id, label, attributes) {
    if( attributes == undefined && typeof label == 'object' )
      [attributes,label] = [label];
    else if( attributes == undefined )
      attributes = {};
      
    super('div',{...attributes, id});
    if( schema.type != 'array' ) {
      console.error('EnumValueArray: schema must be of type "array".');
      return;
    }

    this.classList.add('enum-array');
    
    this.children.append(new Element('label', label ?? schema.title??'', {'for':id+'--array'}));
    const ul = this.children.append(new Element('ul', {tabindex:0}));
    
    const valueList = getStringValuesList(schema.items.enum, schema.items.anyOf || schema.oneOf);
    ul.children.append(...valueList.map(v=>{
      const li = new Element('li', {class:'enum-value'});
      li.children.append(new Element('input',{type:'checkbox',id:id+'.'+v.const, name: id, checked: obj.includes?.(v.const)}),
                         new Element('label', v.title??toNiceText(v.const), {'for':id+'.'+v.const,title: v.description}));
      return li;
    }));
  }
}

class OptionGroup extends Element {
  #baseKey; #obj; #schema;
  
  constructor(baseKey, obj, schema, subKeys, attributes) {
    function getValue(key) {
      return key.reduce((acc,k)=>acc?.[k],obj);
    }
    function getSubSchema(key) {
      return key.reduce((acc,k)=>{
        let next;
        switch(acc.type) {
          case 'object':
            if( acc.properties?.[k] != undefined )
              return acc.properties?.[k];
            if( acc.patternProperties != undefined ) {
              for( const pp in acc.patternProperties ) {
                const rx = new RegExp(pp);
                if( k.test(rx) ) return acc.patternProperties[pp];
              }
            }
            return typeof acc.additionalProperties == 'object'? acc.additionalProperties : undefined;
            
          case 'array':
            if( acc.prefixItems?.length > +k )
              return acc.prefixItems[+k];
            return acc.items;
          
          default:
            return undefined;
        }
      }, schema);
    }
    
    super('div',attributes)    
    this.#baseKey = baseKey;
    this.#obj = obj;
    this.#schema = schema;
    this.classList.add('option-group');

    subKeys.map(key=>({key, splitKey:key.split('.')}))
      .map(k=>({...k,value:getValue(k.splitKey),schema:getSubSchema(k.splitKey)}))
      .filter(k=>typeof k.schema == 'object')
      .forEach(k=>this.#addInputField(k));
  }
  
  #addInputField({key, splitKey,value,schema}) {
    const fullKey = this.#baseKey+'.'+key;
    switch( schema?.type ) {
      case 'string':
        if( schema.enum )
          this.children.append(
            new DropdownInputLine(fullKey,
                                  schema.title ?? splitKey.at(-1),
                                  value,
                                  prepareDropdownOptions(schema.enum, schema.anyOf ?? schema.oneOf))
          );
        else
          this.children.append(
            new TextInputLine(fullKey,
                              schema.title ?? splitKey.at(-1),
                              value)
          );
        break;
      case 'integer':
      case 'numeric':
        this.children.append(
          new NumericInputLine(this.#baseKey + '.' + key,
                               schema.title ?? splitKey.at(-1),
                               value)
        );
        break;
      case 'boolean':
        this.children.append(
          new CheckboxInputLine(this.#baseKey+'.'+key,
                                schema.title ?? splitKey.at(-1),
                                value)
        );
        break;
      case 'object':
      case 'array':
        break;
      case undefined:
        break;
      default:
        break;
    }
  }  
}

class Summary extends Element {
  #items = [];
  
  constructor() {
    super('div', {class: 'summary'});
  }
  
  get allwaysVisible() {
    return this.classList.has('allways-visible');
  }
  set allwaysVisible(v) {
    if( v )
      this.classList.add('allways-visible');
    else
      this.classList.remove('allways-visible');

  }
  add(title,value,details,groupKey) {
    this.#items.push({title, value, details, groupKey});
  }
  


  preRender() {
    if( this.#items.length == 0 ) return false;
    
    const previousKey = undefined;
    const aggregated = this.#items.reduce((acc,i,index)=>{
      const key = i.groupKey ?? i.title ?? previousTitle ?? '__index__'+index;
      acc[key] ??= {index, grouped:[]};
      acc[key].grouped.push(i);
      return acc;
    }, {});

    this.children.append(...Object.entries(aggregated)
      .map(([,v])=>v)
      .sort((a,b)=>a.index-b.index)
      .map(g=>{
        const si = new Element('p', {class: 'summary single-line'});
        let previousTitle = undefined;
        g.grouped.forEach(i=>{
          if( i.title != previousTitle && i.title != undefined ) si.children.append(new Element('span', i.title, {class:'title'}));
          previousTitle = i.title;
          if( i.value != undefined ) si.children.append(new Element('span', i.value, {class:'value'}));
          if( i.details != undefined ) si.children.append(new Element('span', i.details, {class:'details'}));
        });
        return si;
      }));
  }

  
  __preRender() {
/*
    function condenseList(list) {
      if( list.length == 0 )
        return list;
      const filtered = list.filter(i=>i!=undefined && i != '');
      if( filtered.length == 0 )
        return filtered;
      if( filtered.length == 1 && filtered[0] == list.at(-1) )
        return filtered;
      return list;
    }
*/    
    if( this.#items.length == 0 ) return false;
    
    let previousTitle = '';
    const aggregated = this.#items.reduce((acc,i,index)=>{
      const title = i.title ?? previousTitle;
      previousTitle = i.noAggregation? '' : title;
      const key = (i.noAggregation || title=='')? '__index__'+index : title;
      acc[key] ??= {title, index, values:[], details:[]};
      if( i.value != undefined ) acc[key].values.push(i.value);
      if( i.details != undefined ) acc[key].details.push(i.details);
      return acc;
    }, {});
/*    Object.entries(aggregated).forEach(([,v])=>{
      v.values = condenseList(v.values);
      v.details = condenseList(v.details);
    });
    */

    this.children.append(...Object.entries(aggregated)
      .map(([,v])=>v)
      .sort((a,b)=>a.index-b.index)
      .map(a=>{
        const si = new Element('p', {class: 'summary single-line'});
        si.children.append(new Element('span', a.title, {class:'title'}));
        for( let i = 0 ; i < a.values.length || i < a.details.length ; i++ ) {
          if( a.values[i] ) si.children.append(new Element('span',a.values[i],{class:'value'}));
          if( a.details[i] ) si.children.append(new Element('span',a.details[i],{class:'details'}));
        }
        return si;
      }));
  }
}

module.exports = {
  ValueGroupWrapper,
  PopupValueGroupWrapper,
  EnumValueArray,
  OptionGroup,
  Summary,
}