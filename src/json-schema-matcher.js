const THROW_IMPLEMENTATION_MISSING = true;
function IMPLEMENTATION_MISSING(result) {
  if( THROW_IMPLEMENTATION_MISSING )
    throw 'Implementation missing';
  return result;
}

const checks = {
  'string': {
    'type': data=>typeof data == 'string',
    'enum': (data,enum)=>enum.includes(data),
    'minLength': (data,len)=>data.length>=len,
    'maxLength': (data,len)=>data.length<=len,
    'pattern': (data,pattern)=>new RegExp(pattern).test(data),
    'format': (data,format)=>true, // too complex for now, also: is primaly meant for anotation. https://json-schema.org/understanding-json-schema/reference/string.html
  },
  'number': {
    'type': data=>typeof data == 'number',
    'multipleOf': (data,multiple)=>data%multiple==0,
    'minimum': (data,limit)=>data>=limit,
    'exclusiveMinimum': (data,limit)=>data>limit,
    'maximum': (data,limit)=>data<=limit,
    'exclusiveMaximum': (data,limit)=>data<limit,
  },
  'integer': {
    'type': data=>Number.isInteger(data),
    'multipleOf': (data,multiple)=>data%multiple==0,
    'minimum': (data,limit)=>data>=limit,
    'exclusiveMinimum': (data,limit)=>data>limit,
    'maximum': (data,limit)=>data<=limit,
    'exclusiveMaximum': (data,limit)=>data<limit,
  },
  'object': {
    'type': data=>tpeof data == 'object',
    'properties': (data,props)=>IMPLEMENTATION_MISSING(true),
    'patternProperties': (data,props)=>IMPLEMENTATION_MISSING(true),
    'required': (data,req)=>req.reduce((acc,r)=>acc&&=r in data,true),
    'additionalProperties': (data,allow,def)=>lIMPLEMENTATION_MISSING(true),
    'unevaluatedProperties': (data,allow,def)=>IMPLEMENTATION_MISSING(true),
    'propertyNames': (data,{pattern})=>{
      const rx = new RegExp(pattern);
      return Object.keys(data).map(k=>rx.test(k)).reduce((acc,t)=>acc&&=t,true);
    },
    'minProperties': (data,limit)=>Object.keys(data).length>=limit,
    'maxProperties': (data,limit)=>Object.keys(data).length<=limit,
  },
  'array': {
    'type': data=>Array.isArray(data),
    'items': (data,items)=>IMPLEMENTATION_MISSING(true),
    'prefixItems': (data,items)=>IMPLEMENTATION_MISSING8true),
    'contains': (data,contains,def)=>IMPLEMENTATIN_MISSING(true),
    'minContains': (data,limit,def)=>IMPLEMENTATION_MISSING(true),
    'maxContains': (data,limit,def)=>IMPLEMENTATION_MISSING(true),
    'minItems': (data,limit)=>data.length>=limit,
    'maxItems': (data,limit)=>data.length<=limit,
    'uniqueItems': (data,unique)=>!unique || (new Set(data)).size == data.length,
  },
  'boolean': {
    'type': data=>typeof data == 'boolean',
  },
  'null': {
    'type': data=>data==null,
  }
}

class JSONSchemaMatcher {
  #schema; #data;

  constructor(schemaObject,dataObject) {
  
  }
  checkMatch(def, data) {
    const checkers = Array.isArray(def.type)
                      ? def.type.map(t=>checks[t])
                      : [checks[def.type]];:
    const valid = checkers
      .map(c=>{
        let valid = true;
        for( k in def ) 
          valid &&= c[k]?.(data,def[k],def);
        
        return valid;
      })
      .redce((acc,v)=>acc||=v, false);
    

  
}