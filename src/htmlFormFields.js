const {Element, BR} = require('./html');
const {toNiceText} = require('./utility');


class TextInput extends Element {
  constructor(id, value, attributes) {
    super('input',Object.assign({
      type:'text',
      id,
      name: id,
      value,
    }, attributes))
  }
}
class Label extends Element {
  constructor(label,id,attributes) {
    super('label',label,Object.assign({for:id,},attributes));
  }
}
class Description extends Element {
  constructor(text, attributes) {
    super('span', text, attributes);
    this.classList.add('description');
  }
}

class InputLine extends Element {
  constructor(id, label, description, attributes) {
    super('p', {class: attributes?.class});
    this.label = this.children.append(new Element('label',  label, {for: id}));
    this.inputs = this.children.append(new Element()).children;
    if( description != undefined && description.trim() != '' )
      this.description = this.children.append(new Element('span', description, {class: 'description'}));
  }
}

class TextInputLine extends InputLine {
  constructor(id, label, value, description, attributes) {
    super(id, label, description, attributes);
    this.input = this.inputs.append(new Element('input', Object.assign({style:'vertical-align:top;'}, attributes, {id, name: id, type: 'text', value, class:undefined})));
  }
}
/*
class TextInputLine extends Element {
  constructor(id, label, value, description, attributes) {
    super('p', {class: attributes?.class});
    this.label = new Element('label',  label, {for: id});
    this.input = new Element('input', Object.assign({style:'vertical-align:top;'}, attributes, {id, name: id, type: 'text', value, class:undefined}));
    this.description = new Element('span', description, {class: 'description'});
    
    this.children.append(this.label, this.input, new BR(), this.description);
  }
}
*/
class MultiSelectInputLine extends InputLine {
  constructor(id, label, values, options, description, attributes) {
    super(id, label, description, attributes);
    this.input = this.inputs.append(new Element('select',Object.assign({id, name: id}, attributes, {multiple: true, class:undefined})));
    options.forEach(o=>{
      if( typeof o == 'string' ) o = {'const':o};
      this.input.children.append(
        new Element('option', o.title ?? toNiceText(o.const), {
          value:o.const,
          selected: values.includes(o.const),
          style: 'vertical-align: top',
      }));
    });
  }
  get multiple() {
    return this.input.attributes.multiple == true;
  }
  set multiple(v) {
    this.input.attributes.multiple = v == true;
  }
}
class DropdownInputLine extends MultiSelectInputLine {
  constructor(id, label, value, options, description, attributes) {
    super(id, label, [value], options, description, attributes);
    this.multiple = false;
  }
}

class RadioInputLine extends InputLine {
  constructor(id, label, value, options, description, attributes) {
    super(id, label, description, attributes);
    this.buttonList = this.inputs.append(new Element('span', {class:'radio-button-list'}));
    options.forEach(o=>{
      if( typeof o == 'string' ) o = {const:o};
      const span = new Element('span', {class:'radio-button'});
      span.children.append(
        new Element('input', {type:'radio',name:id,value:o.const,id:`${id}--${o.const}`,checked:o.const==value}),
        new Element('label',o.title??toNiceText(o.const),{for:`${id}--${o.const}`,title:o.description})
      );
      this.buttonList.children.append(span);
    })
  }
}

class NumericInputLine extends InputLine {
  constructor(id, label, value, description, attributes) {
    super(id, label, description, attributes);
    this.input = this.inputs.append(new Element('input', Object.assign({style:'vertical-align:top;'}, attributes, {id, name: id, type: 'number', value, class:undefined})));
  }
}

class TextareaInputLine extends InputLine {
  constructor(id, label, value, description, attributes) {
    super(id, label, description, attributes);
    this.input = this.inputs.append(new Element('textarea', value, Object.assign({rows:4,cols:80,style:'vertical-align:top; font-family:sans-serif;'}, attributes, {id, name: id, class:undefined})));
  }
}


class Legend extends Element {
  constructor(title, subtitle, attributes) {
    super('legend', title, attributes);
    this.children.append(new Element('span', subtitle, {
      class: 'description',
    }));
  }
}

module.exports = {
  TextInput,
  Label,
  Description,
  TextInputLine,
  MultiSelectInputLine,
  DropdownInputLine,
  RadioInputLine,
  NumericInputLine,
  TextareaInputLine,
  Legend,
}