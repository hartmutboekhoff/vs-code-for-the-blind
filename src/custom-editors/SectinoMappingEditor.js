const vscode = require('vscode');
const CustomEditorBase = require('../CustomEditorBase');
const { HtmlFrame, Element } = require('../html');
const {ecscenicSections, cueSections, cueThemepages} = require('../SectionsAndThemepages');

class MappingLine {
  constructor(lineNumber,[publication, cueSectionId, cueThemepageId, escenicSectionId, hint]) {
      this.lineNumber = lineNumber;
      this.publication = publication;
      this.cueSectionId = cueSectionId==''? undefined : +cueSectionId;
      this.cueThemepageId = cueThemepageId==''? undefined : +cueThemepageId;
      this.escenicSectionId = escenicSectionId==''? undefined : +escenicSectionId;
      this.hint = hint;
  }
  get isSectionMapping() {
    return this.cueSectionId != undefined;
  }
  get isThemepageMapping() {
    return this.cueThemepageId != undefined;
  }  
  get notMapped() {
    return !this.isSectionMapping && !this.isThemepageMapping;
  }
}
class Mapping {
  #lines;
  constructor(csvData) {
    this.#lines = csvData.split('\r\n')
                         .slice(1)
                         .map((line,ix)=>new MappingLine(ix+1,line.split('\t')));    
  }
  
  [Symbol.iterator]() {
    let index = -1;
    return {
      next: ()=>({
        value: this.#lines[++index],
        done: index in this.#lines
      })
    }
  }
  
  forEscenicSection(eceSection) {
    
  }
  forCueSection(cueSection) {
    
  }
  forCueThemepage(cueThemepage) {
    
  }
}


class SectionMappingEditor extends CustomEditorBase {
  #mapping;

	constructor(context, document, webviewPanel, token) {
	  super(context, document, webviewPanel, 'SectionMappingEditorViews', '../config/schema/redirects.schema.json', token);
	  
  }

  #parseData() {
    this.#mapping = new Mapping(this.text);
  }
  
  initialize() {
    this.#parseData();
    super.initialize();
  }
  renderHtml() {
    
  }
  #renderMappingLine(eceSection) {
    const mapping = this.#mapping.orEscenicSection(eceSection);
    const cue = mapping.isSectionMapping
                  ? cueSections.get(mapping.cueSectionId)
                  : mapping.isThemepageMapping
                  ? cueThemepages.get(mapping.cueThemepageId)
                  : undefined;

    
  }

}

module.exports = SectionMappingEditor;