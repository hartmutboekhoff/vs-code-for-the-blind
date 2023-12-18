function getStringValuesList(enumList,anyOf) {
  const result = {};
  if( enumList != undefined )
    enumList.forEach(e=>result[e] = {const:e,title:e})
  if( anyOf != undefined )
    anyOf.forEach(a=>result[a.const] = Object.assign({},result[a.const],a));
  return Object.values(result);
}



module.exports = {
  getStringValuesList,
};

