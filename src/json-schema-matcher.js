const GenericArrayIndex = Symbol();

const DEFAULT_BASE_URI = 'https://schema.funkemedien.de';
const THROW_IMPLEMENTATION_MISSING = true;
function IMPLEMENTATION_MISSING(result) {
  if( THROW_IMPLEMENTATION_MISSING )
    throw 'Implementation missing';
  return result;
}
function NOT_SUPPORTED(feature, context) {
    throw `${feature} is not supported${context==''? '' : ' in '+context}.`;
} 

function isValidIdentifier(s) {
  const validIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return validIdentifier.test(s);
}
function buildSchemaPath(base, ...keys) {
  const rel = keys.reduce((acc,k)=>{
    if( k == GenericArrayIndex )
      return `${acc}[*]`;
    else if( typeof k == 'object' && k.constructor.name == 'RegExp' )
      return `${acc}[/${k.source}/]`;
    else if( isValidIdentifier(k) )
      return `${acc}/${k}`;
    else if( Number.isInteger(+k) )
      return `${acc}[${k}]`;
    else
      return `${acc}["${k.replace('\\','\\\\').replace('"','\\"')}"]`;
  }, '');
  return base + (rel??'');
}
function buildJsonPath(base, ...keys) {
  const rel = keys.reduce((acc,k)=>{
    if( isValidIdentifier(k) )
      return `${acc}.${k}`;
    else if( Number.isInteger(+k) )
      return `${acc}[${k}]`;
    else
      return `${acc}["${k.replace('\\','\\\\').replace('"','\\"')}"]`;
  }, '');
  return base + (rel??'');
  
}
function resolveSchemaPath(path,schema) {
  const resolve = {
    'object': (step,subSchema)=>subSchema.properties?.[step] ?? subSchema.patternProperties?.[step],
    'array': (step,subSchema)=>step == GenericArrayIndex
                                  ? subSchema.items 
                                  : Number.isInteger(step)
                                  ? (subSchema.prefixedItems[step] ?? (subSchema.items == false? undefined : subSchema.items))
                                  : undefined,
  }
  
  const splitRx = /^(.*?)\/|\[(\*)\]|\[(\d+)\]|(?<!\[)(?<=\/)([a-zA-Z_$][a-zA-Z0-9_$]*)(?=[\/\[]|$)(?!\])|\["(.*)(?<!\\)"\]|\[\/(.*?)(?<!\\)\/\]/g;
  const splitPath = [...path.matchAll(splitRx)].reduce((acc,s)=>{
    if( s[1] != undefined )
      acc.root = s[1];
    else
      acc.steps.push(s[4] ?? s[5] ?? s[6] 
                     ?? (s[2] == '*'? GenericArrayIndex : +s[3]);
                     
    return acc;
  },{root:'',steps:[]});
  
  let subSchema = schema;
  for( const step of splitPath.steps ) 
    if( undefined == (subSchema = resolve[subSchema.type]?.(step,subSchema)) )
      break;
  return subSchema;
}
function resolveJsonPath(path,data) {
  const splitRx = /(?<!\[)(?<=\.|^)([a-zA-Z_$][a-zA-Z0-9_$]*)(?=[\.\[]|$)(?!\])|\[(\d+)\]|\["(.*?)(?<!\\)"\]/g;
  let nested = data;
  for( const k of path.matchAll(splitRx) )
    if( undefined == (nested = nested[k[1] ?? k[2] ?? k[3]]) )
      break;
  return nested;
}

class Match {
  #def; #data; #path;
  constructor(def,data,path) {
    
  }
  
}
class JSONSchemaMatcher {
  #schema; #data;
  #matches = [];
  #validators = {
    'string': {
      'type': data=>typeof data == 'string',
      'enum': (data,enum)=>enum.includes(data),
      'minLength': (data,len)=>data.length>=len,
      'maxLength': (data,len)=>data.length<=len,
      'pattern': (data,pattern)=>new RegExp(pattern).test(data),
      'format': (data,format)=>IMPLEMENTATION_MISSING(true), // this is primarily meant for anotation. https://json-schema.org/understanding-json-schema/reference/string.html
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
      'type': data=>typeof data == 'object',
      'properties': (data, properties, schema, schemaPath, jsonPath)=>{
        for( const p in properties ) {
          if( !this.generateSchemaObjectTuples(
                      properties[p], 
                      data[p], 
                      buildSchemaPath(schemaPath, p), 
                      buildJsonPath(jsonPath, p)
                    ) ) {
            return false;
          }
        }

        return true;
      },
      'patternProperties': (data, properties, schema, schemaPath,  jsonPath)=>{
        for( const p in properties ) {
          const subschema = properties[p];
          const rx = new RegExp(p);
          for( const k in data ) {
            if( rx.test(k) 
                && !this.generateSchemaObjectTuples(
                           subschema, 
                           data[k], 
                           buildSchemaPath(schemaPath, p), 
                           buildJsonPath(jsonPath, k)) ) {
              return false;
            }
          } 
        }
        return true;
      },
      'required': (data,required)=>required.reduce((acc,r)=>acc&&=r in data,true),
      'additionalProperties': (data, allow, schema)=>{
        if( allow ) return true;
        
        let invalid = Object.keys(data);
        if( schema.properties != undefined )
          invalid = invalid.filter(i=>!i in schema.properties);

        if( invalid.length == 0 ) 
          return true;
        if( schema.patternProperties == undefined )
          return false;
          
        const rxs = Object.keys(schema.patternProperties).map(p=>new RegExp(p));
        invalid = invalid.filter(i=>{
          for( rx of rxs ) {
            if( rx.test(i) ) 
              return false; 
          }
          return true;
        });
        return invalid.length == 0;
      },
      'unevaluatedProperties': (data,allow,schema)=>IMPLEMENTATION_MISSING(true),
      'propertyNames': (data,{pattern})=>{
        const rx = new RegExp(pattern);
        return Object.keys(data).map(k=>rx.test(k)).reduce((acc,t)=>acc&&=t,true);
      },
      'minProperties': (data,limit)=>Object.keys(data).length>=limit,
      'maxProperties': (data,limit)=>Object.keys(data).length<=limit,
    },
    'array': {
      'type': data=>Array.isArray(data),
      'items': (data, itemSchema, schema, schemaPath, jsonPath)=>{
        const pfxCount = schema.prefixItems?.length ?? 0;
        if( itemSchema == false && data.length > pfxCount ) return false;
        const itemSchemaPath = buildSchemaPath(schemaPath,GenericArrayIndex);
        for( let i = pfxCount ; i < data.length ; i++ ) {
          if( !this.generateSchemaObjectTuples(
                  itemSchema,
                  data[i],
                  itemSchemaPath,
                  buildJsonPath(jsonPath,i)) ) {
            return false;
          }
        }
        return true;
      },
      'prefixItems': (data, prefixItems, schema, schemaPath, jsonPath)=>{
        for( let i = 0 ; i < prefixItems.length ; i++ ) {
          if( !this.generateSchemaObjectTuples(
                  prefixSchemas[i],
                  data[i],
                  buildSchemPath(schemaPath,i),
                  buildJsonPath(jsonPath,i)) ) {
            return false;
          }
          return this.#validators.array.items(data, schema.items, schema, schemaPath, jsonPath);
        }
      },
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
  
  constructor(schemaObject,dataObject) {
  
  }
  
  #getSubSchema(path,schema) {
    const steps = path.split('/');
    if( steps[0] == '' || steps[0] == '#' ) {
      schema = this.#schema;
      steps = steps.slice(1);      
    }
    return steps.reduce((acc,s)=>{
      return acc == undefined || s == '.'? acc : acc.properties?.[s];
    },schema);
  }
  
  generateSchemaObjectTuples(schema, json, schemaPath, jsonPath) {
    if( schema['$ref'] != undefined )
      schema = this.#getSubschema(schema['$ref'], schema);
          
    const validators = Array.isArray(schema.type)
                       ? schema.type.map(t=>this.#validators[t])
                       : [this.#validators[schema.type]];:

    const valid = validators
      .map(v=>{
        let valid = true;
        for( k in schema ) {
          if( k.startsWith('$') )
            // ignore
          else if( typeof v[k] == 'function' )
            valid &&= v[k](json, schema[k], schema, schemaPath, jsonPath) ?? true;
          else
            NOT_SUPPORTED(`"${k}"`,schemaPath);
        }
        return valid;
      })
      .reduce((acc,v)=>acc||=v, false);

  if( valid && typeof data == 'object' )
    this.#matches.push(new Match(def,data,path))
}