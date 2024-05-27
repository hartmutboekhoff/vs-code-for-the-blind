const {Element} = require('../../html');
const {Legend, TextInputLine, DropdowInputLine, CheckboxInputLine, NumericInputLine} = require('../../htmlFormFields');
const {prepareDropdownOptions} = require('../../utility');

class ValueGroupWrapper extends Element {
  constructor(schema, title, subtitle, attributes) {
    if( typeof subtitle == 'object' && attributes == undefined ) [subtitle,attributes] = ['', subtitle];
    super('fieldset', Object.assign({title:schema.description},attributes));
    super.children.append(new Element('legend'))
         .children.append(new Element('span',{class:'collapse-button'}),
                          this.title = new Element('span', title??schema.title),
                          this.subtitle = new Element('span', subtitle, {class:'description'}));
  }
  get viewPath() { return this.attributes['view-path']; }
  set viewPath(v) { 
    if( v == undefined || v.trim() == '' )
      delete this.attributes['view-path'];
    else
      this.attributes['view-path'] = v; 
  }
}

class OptionGroup extends Element {
  #baseKey; #obj; #schema;
  
  constructor(baseKey, obj, schema, subKeys, attributes) {
    function getValue(key) {
      return key.reduce((acc,k)=>acc?.[k],obj);
    }
    function getSubSchema(key) {
      key.reduce((acc,k)=>{
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
      .map(k=>({...k,value:getValue(k.splitKey),schema:getSchema(k.splitKey)}))
      .filter(k=>typeof k.schema == 'object')
      .forEach(k=>this.addInputField(k));
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


module.exports = {
  ValueGroupWrapper,
  OptionGroup,
}