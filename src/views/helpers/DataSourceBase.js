const {Element} = require('../../html');
const {TextInputLine, DropdownInputLine} = require('../../htmlFormFields');
const {ValueGroupWrapper, PopupValueGroupWrapper} = require('../helpers/dataElementViews');
const {getEnumLabel} = require('../helpers/utility');


class DataSourceBase extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, 'Gruppe', obj.params?.groupName ?? obj.params?.groupNames?.join(', ') ?? '', {class: 'content-source'});

    this.initSummary(obj);
  }
  
  initSummary(obj) {
    this.summary.add(obj.count+' Artikel');
    if( obj.params?.publicationName )
      this.summary.add('Publikation',obj.params.publicationName);
    if( obj.params?.sectionName || obj.params?.sectionNames || obj.params?.sectionUniqueName )
      this.summary.add('Rubrik', obj.params?.sectionName ?? obj.params?.sectionNames?.join(', ') ?? obj.params?.sectionUniqueName ?? '');

    if( obj.params?.articleTypes ) 
      this.summary.add('Artikeltypen', obj.params.articleTypes.join(', '));
    if( obj.filters )
      this.summary.add('Filter', obj.filters.map(f=>f.type).join(', '));
    
  }
}

module.exports = {
  DataSourceBase
}
