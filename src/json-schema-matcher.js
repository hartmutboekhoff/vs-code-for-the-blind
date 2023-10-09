const GenericAccessor = Symbol();

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
function buildJsonPath(base, key) {
  if( isValidIdentifier(key) )
    return base==''? key : `${base}.${key}`;
  else if( Number.isInteger(+key) )
    return `${base}[${key}]`;
  else
    return `${base}["${key.replace('\\','\\\\').replace('"','\\"')}"]`;
}

/*
function resolveSchemaPath(path,schema) {
  const resolve = {
    'object': (step,subSchema)=>step == GenericAccessor
                                  ? subSchema.additionalProperties
                                  : (subSchema.properties?.[step] ?? subSchema.patternProperties?.[step]),
    'array': (step,subSchema)=>step == GenericAccessor
                                  ? (subSchema.items || subschema.contains)
                                  : Number.isInteger(step)
                                  ? (subSchema.prefixedItems[step] ?? (subSchema.items || undefined))
                                  : undefined,
  }
  
  const splitRx = /^(.*?)\/|\[(\*)\]|\[(\d+)\]|(?<!\[)(?<=\/)([a-zA-Z_$][a-zA-Z0-9_$]*)(?=[\/\[]|$)(?!\])|\["(.*)(?<!\\)"\]|\[\/(.*?)(?<!\\)\/\]/g;
  const splitPath = [...path.matchAll(splitRx)].reduce((acc,s)=>{
    if( s[1] != undefined )
      acc.root = s[1];
    else
      acc.steps.push(s[4] ?? s[5] ?? s[6] 
                     ?? (s[2] == '*'? GenericAccessor : +s[3]));
                     
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
*/

class JsonSchemaPath {
  paths;

  constructor(copy) {
    this.paths = copy==undefined? ['#'] : [...copy.paths];
  }
  
  clone() {
    return new JsonSchemaPath(this);
  }
  
  _deprecated__append(key) {
    this.paths = this.paths.map(p=>{
      if( key == GenericAccessor )
        return `${p}[*]`;
      else if( typeof key == 'object' && key.constructor.name == 'RegExp' )
        return `${p}[/${key.source}/]`;
      else if( isValidIdentifier(key) )
        return `${p}/${key}`;
      else if( Number.isInteger(+key) )
        return `${p}[${key}]`;
      else
        return `${p}["${key.replace('\\','\\\\').replace('"','\\"')}"]`;
    });
    return this;
  }
  addSubschema(ref) {
    if( !this.paths.includes(ref) )
      this.paths.push(ref);
    return this;
  }
  appendIndex(n) {
    this.paths = this.paths.map(p=>`${p}[${n}]`);
    return this;
  }
  appendProperty(k) {
    if( isValidIdentifier(k) )
      this.paths = this.paths.map(p=>`${p}/${k}`);
    else
      this.paths = this.paths.map(p=>`${p}["${k.replace('\\','\\\\').replace('"','\\"')}"]`);
    return this;
  }
  appendPatternProperty(rx) {
    if( typeof rx == 'object' && rx.constructor.name == 'RegExp' )
      this.paths = this.paths.map(p=>`${p}[/${rx.source}/]`);
    else
      this.paths = this.paths.map(p=>`${p}[/${rx}/]`);
    return this;
  }
  appendAnyOf(n) {
    this.paths = this.paths.map(p=>`${p}@anyOf[${n}]`);
    return this;
  }
  appendAllOf(n) {
    this.paths = this.paths.map(p=>`${p}@allOf[${n}]`);
    return this;
  }
  appendOneOf(n) {
    this.paths = this.paths.map(p=>`${p}@oneOf[${n}]`);
    return this;
  }
  appendGenericAccessor() {
    this.paths = this.paths.map(p=>`${p}[*]`);
    return this;
  }
  appendAdditionalProperty() {
    return this.appendGenericAccessor();
  }
}

class Match {
  //#schema; #data; 
  //#schemaPath; #jsonPath;
  
  constructor(schema, data, schemaPath, jsonPath, valid=true) {
    this.schema = schema;
    this.data = data;
    this.schemaPath = schemaPath;
    this.jsonPath = jsonPath;
    this.valid = valid;
  }
}

class JsonSchemaMatcher {
  #schema; #data;
  #matches = [];
  #validators = {
    'any': {
      '@name': 'any',
      'type': ()=>true,
    },
    'string': {
      '@name': 'string',
      'type': data=>typeof data == 'string',
      'enum': (data,enums)=>enums.includes(data),
      'minLength': (data,len)=>data.length>=len,
      'maxLength': (data,len)=>data.length<=len,
      'pattern': (data,pattern)=>new RegExp(pattern).test(data),
      'format': (data,format)=>IMPLEMENTATION_MISSING(true), // this is primarily meant for anotation. https://json-schema.org/understanding-json-schema/reference/string.html
    },
    'number': {
      '@name': 'number',
      'type': data=>typeof data == 'number',
      'multipleOf': (data,multiple)=>data%multiple==0,
      'minimum': (data,limit)=>data>=limit,
      'exclusiveMinimum': (data,limit)=>data>limit,
      'maximum': (data,limit)=>data<=limit,
      'exclusiveMaximum': (data,limit)=>data<limit,
    },
    'integer': {
      '@name': 'integer',
      'type': data=>Number.isInteger(data),
      'multipleOf': (data,multiple)=>data%multiple==0,
      'minimum': (data,limit)=>data>=limit,
      'exclusiveMinimum': (data,limit)=>data>limit,
      'maximum': (data,limit)=>data<=limit,
      'exclusiveMaximum': (data,limit)=>data<limit,
    },
    'object': {
      '@name': 'object',
      'type': data=>typeof data == 'object',
      'properties': (data, properties, schema, schemaPath, jsonPath)=>{
        let result = true;
        for( const p in properties ) {
          if( p in data ) {
            const schemaPath2 = schemaPath.clone().appendProperty(p);
            const jsonPath2 = buildJsonPath(jsonPath, p);
            const valid = this.#validate(properties[p], data[p], schemaPath2, jsonPath2);
            this.#addMatch(properties[p], data[p], schemaPath2, jsonPath2, valid);
            result &&= valid;
          }
        }
        return result;
      },
      'patternProperties': (data, properties, schema, schemaPath,  jsonPath)=>{
        let result = true;
        for( const p in properties ) {
          const subSchema = properties[p];
          const rx = new RegExp(p);
          const subSchemaPath = schemaPath.clone().appendPatternProperty(rx);
          for( const k in data ) {
            if( rx.test(k) ) {
              const jsonPath2 = buildJsonPath(jsonPath, k);
              const valid = this.#validate(subSchema, data[k], subSchemaPath, jsonPath2);
              this.#addMatch(subSchema, data[k], subSchemaPath, jsonPath2, valid);
              result &&= valid;
            }
          } 
        }
        return result;
      },
      'required': (data,required)=>required.reduce((acc,r)=>acc&&r in data,true),
      'additionalProperties': (data, additionalProperties, schema, schemaPath, jsonPath)=>{
        let additionals = Object.keys(data);

        if( schema.properties != undefined )
          additionals = additionals.filter(a=>!(a in schema.properties));

        if( additionals.length == 0 ) return true;

        if( schema.patternProeprties != undefined ) {
          const rxs = Object.keys(schema.patternProeprties).map(k=>new RegExp(k));
          additionals = additionals.filter(a=>!rxs.reduce((acc,rx)=>acc||rx.test(a)));
        }
        
        if( additionals.length == 0 ) return true;
        if( additionalProperties == false ) return false;
        
        const schemaPath2 = schemaPath.clone().appendAdditionalProperty();
        let aggValid = true;
        for( const a of additionals ) {
          const jsonPath2 = buildJsonPath(jsonPath, a);
          const valid = this.#validate(additionalProperties, data[a], schemaPath2, jsonPath2);
          this.#addMatch(additionalProperties, data[a], schemaPath2, jsonPath2, valid);
          aggValid &&= valid;
        }
        return aggValid;
      },
      'unevaluatedProperties': (data,allow,schema)=>IMPLEMENTATION_MISSING(true),
      'propertyNames': (data,{pattern})=>{
        const rx = new RegExp(pattern);
        return Object.keys(data).map(k=>rx.test(k)).reduce((acc,t)=>acc&&=t,true);
      },
      'minProperties': (data,limit)=>Object.keys(data).length>=limit,
      'maxProperties': (data,limit)=>Object.keys(data).length<=limit,
      'definitions': ()=>true,
    },
    'array': {
      '@name': 'array',
      'type': data=>Array.isArray(data),
      '__items': (data, itemSchema, skip, schema, schemaPath, jsonPath)=>{
        skip ??= 0;
        if( data.length <= skip ) return true;
        if( itemSchema == false ) return false;
        const itemSchemaPath = schemaPath.clone().appendGenericAccessor();
        let result = true;
        for( let i = skip ; i < data.length ; i++ ) {
          const jsonPath2 = buildJsonPath(jsonPath, i);
          const valid = this.#validate(itemSchema, data[i], itemSchemaPath, jsonPath2);
          this.#addMatch(itemSchema, data[i], itemSchemaPath, jsonPath2, valid);
          result &&= valid;
        }
        return result;
      },
      'items': (data, itemSchema, schema, schemaPath, jsonPath)=>{
        if( schema.prefixItems != undefined ) return true; // validation is performed by prefixSchema validator
        return this.#validators.array.__items(data, itemSchema, 0, schema, schemaPath, jsonPath);
      },
      'prefixItems': (data, prefixItems, schema, schemaPath, jsonPath)=>{
        let aggValid = true;
        for( let i = 0 ; i < prefixItems.length ; i++ ) {
          const schemaPath2 = schemaPath.clone().appendIndex(i);
          const jsonPath2 = buildJsonPath(jsonPath, i);
          const valid = this.#validate(prefixItems[i], data[i], schemaPath2, jsonPath2);
          this.#addMatch(prefixItems[i], data[i], schemaPath2, jsonPath2, valid);
          aggValid &&= valid;
        }
        return this.#validators.array.__items(data, schema.items, prefixItems.length, schema, schemaPath, jsonPath) && aggValid;
      },
      'contains': (data,contains,schema,schemaPath,jsonPath)=>{
        const min = schema.minContains ?? 1;
        const max = schema.maxContains ?? Infinity;
        const schemaPath2 = schemaPath.clone().appendGenericAccessor();
        let count = 0;
        for( let i = 0 ; i < data.length ; i++ ) {
          const jsonPath2 = buildJsonPath(jsonPath, i);
          if( this.#validate(contains, data[i], schemaPath2, jsonPath) ) {
            if( ++count >= min && max == Infinity ) return true;
            if( count > max ) return false;
          }
        }
        return count >= min && count <= max;
      },
      'minContains': ()=>true, // validated in array.contains()
      'maxContains': ()=>true, // validated in array.contains()
      'minItems': (data,limit)=>data.length>=limit,
      'maxItems': (data,limit)=>data.length<=limit,
      'uniqueItems': (data,unique)=>!unique || (new Set(data)).size == data.length,
    },
    'boolean': {
      '@name': 'boolean',
      'type': data=>typeof data == 'boolean',
    },
    'null': {
      '@name': 'null',
      'type': data=>data==null,
    }
  };
  // default validators if nothing is defined for the specific type
  #validatorFallbacks = {
    'anyOf': false, // not supported
    'allOf': false, // not supported
    'oneOf': false, // not supported
    'not': false,   // not supported
    'if': false,    // not supported
    'then': false,  // not supported
    'else': false,  // not supported

    // not supported but also not an error
    'title': true,
    'description': true,
    'additionalProperties': true,
    'contains': true,
    'enum': true,
    'exclusiveMaximum': true,
    'exclusiveMinimum': true,
    'format': true,
    'items': true,
    'maxContains': true,
    'maxItems': true,
    'maxLength': true,
    'maxProperties': true,
    'maximum': true,
    'minContains': true,
    'minItems': true,
    'minLength': true,
    'minProperties': true,
    'minimum': true,
    'multipleOf': true,
    'pattern': true,
    'patternProperties': true,
    'prefixItems': true,
    'properties': true,
    'propertyNames': true,
    'required': true,
    'unevaluatedProperties': true,
    'uniqueItems': true,
    
    'definitions': true,
    '$defs': true,
    '$schema': true,
    '$id': true,
    '$anchor': false,
    '$comment': true,
    '$dynamicRef': false,
    '$dynamicAnchor': false,
    '$recursiveAnchor': false,
    '$recursiveRef': false,
  };

  constructor(schemaObject,dataObject) {
    this.#schema = schemaObject;
    this.#data = dataObject;
    
    this.#startMatching();
  }
  
  #resolveSubSchema(schema) {
    const path = schema['$ref'];
    if( path == undefined )
      return schema;
      
    let steps = path.split('/');
    if( steps[0] == '' || steps[0] == '#' ) {
      schema = this.#schema;
      steps = steps.slice(1);      
    }
    return steps.reduce((acc,s)=>{
      return acc == undefined || s == '.'? acc : (acc[s] ?? acc.properties?.[s]);
    },schema);
  }
  #addMatch(schema, json, schemaPath, jsonPath, valid) {
    if( typeof json == 'object' )
      this.#matches.push(new Match(this.#resolveSubSchema(schema), json, schemaPath, jsonPath, valid));
  }
  #validate(schema, json, schemaPath, jsonPath) {
    //console.log(...arguments);
    if( schema['$ref'] != undefined ) {
      schemaPath.addSubschema(schema['$ref']);
      schema = this.#resolveSubSchema(schema);
    }
          
    const typeValidators = Array.isArray(schema.type)
                             ? schema.type.map(t=>this.#validators[t])
                             : [this.#validators[schema.type]];

    return typeValidators
      .map(tv=>{
        let valid = true;
        for( const k in schema ) {
          const validator = tv[k] ?? this.#validatorFallbacks[k];
          if( typeof validator == 'function' )
            valid = validator(json, schema[k], schema, schemaPath, jsonPath) && valid;
          else if( validator != true )
            NOT_SUPPORTED(`"${k}"`,schemaPath);
        }
        return valid;
      })
      .reduce((acc,v)=>acc||v, false);
  }  
  #startMatching() {
    const schemaPath = new JsonSchemaPath();
    const valid = this.#validate(this.#schema, this.#data, schemaPath.clone(), '');
    this.#addMatch(this.#schema, this.#data, schemaPath, '', valid)
  }
  
  get matches() {
    return this.#matches;
  }
  findAllMatches(obj) {
    return this.#matches.filter(m=>m.data === obj);
  }
}

try {
module.exports = JsonSchemaMatcher;
}
catch(e) {
  // ignore, this is only for dev-testing
}