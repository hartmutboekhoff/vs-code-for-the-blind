const {Element, BR} = require('./html');

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

class TextInputLine extends Element {
  constructor(id, label, value, description, attributes) {
    super('p', {class: attributes?.class});
    this.label = new Element('label',  label, {for: id});
    this.input = new Element('input', Object.assign({id, name: id, type: 'text', value}, attributes, {class:undefined}));
    this.description = new Element('span', description, {class: 'description'});
    
    this.children.append(this.label, this.input, new BR(), this.description);
  }
}

class DropdownInputLine extends Element {
  constructor(id, label, value, options, description, attributes) {
    super('p', {class: attributes?.class});

    this.label = new Element('label',  label, {for: id});
    this.input = new Element('select',Object.assign({id, name: id}, attributes, {class:undefined}));
    options.forEach(o=>{
      const optEl = new Element('option', o, {value:o});
      if( o == value ) optEl.attributes.selected = true;
      this.input.children.append(optEl);
    })
    this.description = new Element('span', description, {class: 'description'});

    this.children.append(this.label, this.input, new BR(), this.description);
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
  DropdownInputLine,
  Legend,
}