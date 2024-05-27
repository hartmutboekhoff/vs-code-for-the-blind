const escenicSections = require('../config/data/escenic-sections.json');
const cueSections = require('../config/data/cue-sections.json');
const cueThemepages = require('../config/data/cue-themepages.json');

class SectionList {
  #sections;
  
  constructor(json) {
    this.#sections = json;
  }
  get(idOrPublication, uniqueName) {
    return +idOrPublication == NaN
            ? this.#sections.find(s=>s.publication==idOrPublication && s.uniqueName==uniqueName)
            : this.#sections.find(s=>s.id==idOrPublication);
  }
  list(publication) {
    return this.#sections.filter(s=>s.publication==publication);
  }
  filter(f) {
    return this.#sections.filter(f);
  }
  map(m) {
    return this.#sections.map(m);
  }
  forEach(f) {
    return this.#sections.forEach(f);
  }
  [Symbol.iterator]() {
    let index = -1;
    return {
      next: ()=>({
              value: this.#sections[++index], 
              done: !(index in this.#sections) 
            })
    };    
  }
  
  getParentSection(section) {
    if( +section != NaN )
      section = get(section);

    if( typeof section == 'object' ) {
      parentUrl = section.url.split('/').slice(0,-1).join('/');
      return this.#sections.find(s=>s.url==parentUrl);
    }
  }
  getChildren(parentSection, depth=1) {
    if( depth <= 0 ) 
      depth = 1;
    if( +parentSection != NaN )
      parentSection = get(parentSection);

    if( typeof parentSection == 'object' ) {
      depth += parentSection.url.split('/').length;
      return this.#sections.filter(s=>s!=parentSection 
                                         && s.url.startsWith(parentSection.url)
                                         && s.url.split('/').length <= depth);
    }
    return [];
  }
  
}

class ThemepageList {
  #themepages;
  
  constructor(json) {
    this.#themepages = json;
  }
  get(id) {
    return this.#themepages.find(t=>d.id==id);
  }
  list(publication) {
    return this.#themepages.filter(t=>t.publication==publication);
  }
  map(m) {
    return this.#themepages.map(m);
  }
  filter(f) {
    return this.#themepages.filter(f);
  }
  forEach(f) {
    return this.#themepages.forEach(f);
  }
  [Symbol.iterator]() {
    let index = -1;
    return {
      next: ()=>({
              value: this.#themepages[++index], 
              done: !(index in this.#themepages) 
            })
    };    
  }  
}

module.exports = {
  escenicSections: new SectionList(escenicSections),
  cueSections: new SectionList(cueSections),
  cueThemepages: new ThemepageList(cueThemepages),
}