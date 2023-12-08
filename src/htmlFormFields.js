const {Element, BR} = require('./html');

function getNiceText(name) {
  return name
    .replaceAll(/([-_]+)|(?:([a-z0-9])([A-Z]))/g,(m,p1,p2,p3)=>p1!=undefined?' ':p2+' '+p3)
    .replaceAll(/\b[A-Z]+\b/g,m=>m[0]+m.slice(1).toLowerCase());
}

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
    this.input = new Element('input', Object.assign({}, attributes, {id, name: id, type: 'text', value, class:undefined}));
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
      const optEl = new Element('option', getNiceText(o), {value:o});
      if( o == value ) optEl.attributes.selected = true;
      this.input.children.append(optEl);
    })
    this.description = new Element('span', description, {class: 'description'});

    this.children.append(this.label, this.input, new BR(), this.description);
  }
}

class RadioInputLine extends Element {
  constructor(id, label, value, options, description, attributes) {
    super('p', {class: attributes?.class});

    this.label = new Element('label',  label, {for: id});
    this.buttonList = new Element('span', {class:'radio-button-list'});
    options.forEach(o=>{
      const span = new Element('span', {class:'radio-button'});
      span.children.append(
        new Element('input', {type:'radio',name:id,value:o,id:`${id}--${o}`,checked:o==value}),
        new Element('label',getNiceText(o),{for:`${id}--${o}`})
      );
      this.buttonList.children.append(span);
    })
    this.description = new Element('span', description, {class: 'description'});

    this.children.append(this.label, this.buttonList, new BR(), this.description);
  }
}

class NumericInputLine extends Element {
  constructor(id, label, value, description, attributes) {
    super('p', {class: attributes?.class});
    this.label = new Element('label',  label, {for: id});
    this.input = new Element('input', Object.assign({}, attributes, {id, name: id, type: 'number', value, class:undefined}));
    this.description = new Element('span', description, {class: 'description'});
    
    this.children.append(this.label, this.input, new BR(), this.description);
  }
}

class TextareaInputLine extends Element {
  constructor(id, label, value, description, attributes) {
    super('p', {class: attributes?.class});
    this.label = new Element('label',  label, {for: id});
    this.input = new Element('textarea', value, Object.assign({rows:4, style:'vertical-allign:top; font-family:sans-serif;'}, attributes, {id, name: id, class:undefined}));
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
  RadioInputLine,
  NumericInputLine,
  TextareaInputLine,
  Legend,
}