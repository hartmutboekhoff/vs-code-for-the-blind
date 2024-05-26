const {Element} = require('../../html');
const {Legend} = require('../../htmlFormFields');

class ValueGroupWrapper extends Element {
  constructor(schema, title, subtitle, attributes) {
    if( typeof subtitle == 'object' && attributes == undefined ) [subtitle,attributes] = ['', subtitle];
    super('fieldset', Object.assign({title:schema.description},attributes));
    this.children.append(new Element('legend'))
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


module.exports = {
  ValueGroupWrapper,
}