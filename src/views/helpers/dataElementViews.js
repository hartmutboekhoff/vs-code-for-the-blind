const {buildJsonPath} = require('../../utility');
const {Element} = require('../../html');
const {Legend, TextInputLine} = require('../../htmlFormFields');

class ValueGroupWrapper extends Element {
  constructor(schema, key, path, attributes) {
    super('fieldset', Object.assign({title:schema.description},attributes));
    this.children.append(new Element('legend'))
        .children.append(new Element('span',{class:'collapse-button'}),
                         new Element('span', schema.title??key),
                         new Element('span', path, {class:'description'}));
  }
}


module.exports = {
  ValueGroupWrapper,
}