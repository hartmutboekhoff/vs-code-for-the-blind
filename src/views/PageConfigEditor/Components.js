const {Element, PlainText, Textarea} = require('../../html');
const {ValueGroupWrapper} = require('../helpers/dataElementViews');
const {buildJsonPath,renameObjectProperty} = require('../../utility');



class Components extends ValueGroupWrapper {
  constructor(obj, schema, key, path, status) {
    super(schema, key, path);

    this.summary.allwaysVisible = true;
    const sum = obj.reduce((acc,c)=>{
      return c['$contentConfig']?.reduce((acc1,cc)=>{
        acc1.min += cc.minCount??0;
        acc1.max += cc.maxCount??0;
        return acc;
      },acc) ?? acc;
    },{min:0,max:0});
    this.summary.add('Artikel auf der Seite',`Mindestens ${sum.min} Artikel`);
    this.summary.add('Artikel auf der Seite',`Maximal ${sum.max} Artikel`);
    this.collapseChildren = 3;
  }

  get preventSubElements() {
    return false;
  }
}

exports.view = Components;
exports.selectors = [
  {
    SchemaPath: '#.properties.components',
    SchemaType: undefined,
    DataType: undefined,
    //EditorType: "PageConfigEditor"
  }
];

