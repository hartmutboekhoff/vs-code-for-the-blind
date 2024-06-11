function getStringValuesList(enumList,anyOf) {
  const result = {};
  if( enumList != undefined )
    enumList.forEach(e=>result[e] = {const:e,title:e})
  if( anyOf != undefined )
    anyOf.forEach(a=>result[a.const] = Object.assign({},result[a.const],a));
  return Object.values(result);
}

function getEnumLabel(value, anyOf) {
  const l = anyOf?.find(a=>a.const==value);
  return new (class{
    title=l?.title??value;
    description=l?.description;
    toString() {return this.title}
  });
}

function prettyRange(min,max) {
  min ??= 0;
  max ??= min;
  return min==max? `${min}` : `${min}-${max}`;
}

function getSourceParams(sourceType,params) {
  switch( sourceType ) {
    case 'group':
      return params.groupName 
             ?? params.groupNames?.join(', ') 
             ?? params.groupId 
             ?? params.groupIds?.join(', ') 
             ?? '';
    
    case 'list':
      return params.listName ?? params.listNames?.join(', ') ?? '';

    case 'section':
      return params.sectionName 
             ?? params.sectionNames?.join(', ') 
             ?? params.sectionIds?.join(', ')
             ?? params.sectionUniqueName
             ?? '';
    
    case 'relation':
      return params.relationsNames?.join(', ');

    default:
      return '';
  }
}

function aggregateArticleTypes(...sources) {
  const atypes = [...sources?.reduce((acc,s)=>{
    if( s?.params?.articleTypes?.length )
      acc = acc.union(new Set(s.params.articleTypes));
    return acc;
  }, new Set())];
  return atypes.join(', ');
  
}

module.exports = {
  getStringValuesList,
  getEnumLabel,
  prettyRange,
  getSourceParams,
  aggregateArticleTypes,
};

