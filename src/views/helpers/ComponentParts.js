const {Element} = require('../../html');

class ComponentLinkLabel extends Element {
  constructor(obj) {
    super('li', {class:'link-label'});
    this.children.append(
      new Element('input',{type:'text', class:'label',value:obj.title??obj.label}),
      new Element('input',{type:'text', class:'link',value:obj.fullPath})
    );
    if( obj.topicTags?.length > 0 )
      this.children.append(new Element('ul',{class:'link-label'}))
        .children.append(obj.topicTags.map(t=>new ComponentLinkLabel(t)));
  }
}
class TopicHeader extends Element {
  constructor(topicheader) {
    super('ul', {class:'link-label topic-header'});
    this.children.append(new Element('label','B&ouml;bbels'));
    this.children.append(new ComponentLinkLabel(topicheader));
  }
}
class ComponentTitle extends Element {
  constructor(obj) {
    super('ul', {class:'link-label component-title'});
    this.children.append(new Element('label', 'Titel'));
    this.children.append(new ComponentLinkLabel(obj));
  }
}

class MinMaxCount extends Element {
  constructor(schema, obj, path, label, attributes) {
    super('p',{class:'min-max-input'});
    this.children.append(
      new Element('label', label??'Anzahl', {for:path+'.minCount'}),
      new Element('label', 'min:', {for:path+'.minCount'}),
      new Element('input',{value:obj.minCount, type:'number',id:path+'.minCount', name: path+'.minCount'}),
      new Element('label', 'max:', {for:path+'.maxCount'}),
      new Element('input',{value:obj.maxCount, type:'number',id:path+'.maxCount', name: path+'.maxCount'})
    )
  }
}
module.exports = {
  ComponentLinkLabel,
  TopicHeader,
  ComponentTitle,
  MinMaxCount,
}