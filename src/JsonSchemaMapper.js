const {isValidIdentifier, buildJsonPath} = require('./utility');

const DEFAULT_BASE_URI = 'https://schema.funkemedien.de';
const MAP_NON_OBJECTS = true;
const MAP_SUBCONDITIONS = 'none'; // 'failed' | 'all' | 'none'
const THROW_IMPLEMENTATION_MISSING = false;

function IMPLEMENTATION_MISSING(result) {
  if( THROW_IMPLEMENTATION_MISSING )
    throw 'Implementation missing';
  return result;
}
function NOT_SUPPORTED(feature, ...context) {
    throw `${feature} is not supported${context.length == 0? '' : ' in '+context.map(c=>c.toString()).join(' - ')}.`;
} 

class JsonSchemaPath {
  paths;

  constructor(copy) {
    this.paths = copy==undefined? ['#'] : [...copy.paths];
  }
  clone() {
    return new JsonSchemaPath(this);
  }
  
  get total() {
  	return this.paths[0];
  }
  get latest() {
  	return this.paths[this.paths.length-1];
  }
  addSubschema(ref) {
    ref = ref.replaceAll('/','.');
    if( !this.paths.includes(ref) )
      this.paths.push(ref);
  }

  append(...args) {
    const appendStr = args.map(a=>{
        return Number.isInteger(a)
                ? `[${a}]`
                : typeof a == 'object' && a.constructor.name == 'RegExp'
                ? `["${a.source.replaceAll('"','\\"')}"]`
                : isValidIdentifier(a)
                ? `.${a}`
                : `["${a.replaceAll('"','\\"')}"]`;
      }).join('');

    const c = this.clone();
    for( let i = 0 ; i < c.paths.length ; i++ )
      c.paths[i] += appendStr;
    return c;
  }
  appendUnmatched() {
    const c = this.clone();
    for( let i = 0 ; i < c.paths.length ; i++ )
      c.paths[i] += '[?]';
    return c;
  }
}

class SchemaObjectMatch {
  //#schema; #data; 
  //#schemaPath; #jsonPath;
  
  constructor(schema, data, schemaPath, jsonPath, valid=true) {
    this.schema = schema;
    this.data = data;
    this.schemaPath = schemaPath;
    this.jsonPath = jsonPath;
    this.status = valid == true
                    ? 'valid' 
                    : valid == false
                    ? 'failed'
                    : valid == undefined
                    ? 'unmatched'
                    : valid;
  }
}

class JsonSchemaObjectMapper {
  #options;
  #schema; #data;
  #matches = []; #pauseMappingCount = 0;
  #validators = {
    $: { 
      '@name': 'subschemas without type-node',
      'const': (data, constant)=>data==constant,
      'if': (data, condition, schema, schemaPath, jsonPath, unmatchedProperties)=>{
        this.#pauseMapping();
        const subschema = this.#validate(condition, data, schemaPath.append('if'), jsonPath)
                ? 'then' 
                : 'else';

        const valid = schema[subschema] != undefined 
                        ? this.#validate(schema[subschema], data, schemaPath.append(subschema), jsonPath)
                        : true;
        this.#addSubCondition(schema[subschema], data, schemaPath.append(subschema), jsonPath, valid, subschema);
        this.#resumeMapping();
        return valid;
      },
      'then': (data,condition,schema)=>schema.if != undefined,
      'else': (data,condition,schema)=>schema.if != undefined && schema.then != undefined,
      'not': (data, test, schema, schemaPath, jsonPath, unmatchedProperties)=>{
        this.#pauseMapping();
        const valid = !this.#validate(test, data, schemaPath.append('not'), jsonPath);
        this.#addSubCondition(test, data, schemaPath.append('not'), jsonPath, valid, 'not');
        this.#resumeMapping();
        return valid;
      },
      'anyOf': (data, anyOf, schema, schemaPath, jsonPath, unmatchedProperties)=>{
        this.#pauseMapping();
        let valid = true;
        for( let i = 0 ; i < anyOf.length ; i++ ) {
          valid = this.#validate(anyOf[i], data, schemaPath.append('anyOf', i), jsonPath);
          if( valid ) break;
        }
        this.#addSubCondition(anyOf, data, schemaPath.append('anyOf'), jsonPath, valid, 'anyOf');
        this.#resumeMapping();
        return valid;
      },
      'allOf': (data, allOf, schema, schemaPath, jsonPath, unmatchedProperties)=>{
        this.#pauseMapping();
        let valid = true;
        for( let i = 0 ; i < allOf.length ; i++ ) {
          valid = this.#validate(allOf[i], data, schemaPath.append('allOf', i), jsonPath);
          if( !valid ) break;
        }
        this.#addSubCondition(allOf, data, schemaPath.append('allOf'), jsonPath, valid, 'allOf');
        this.#resumeMapping();
        return valid;
      },
      'oneOf': (data, oneOf, schema, schemaPath, jsonPath, unmatchedProperties)=>{
        this.#pauseMapping();
        let counter = 0;
        for( let i = 0 ; i < oneOf.length ; i++ ) {
          if( this.#validate(oneOf[i], data, schemaPath.append('oneOf', i), jsonPath) )
            ++counter;
          if( counter > 1 ) break;
        }
        this.#addSubCondition(oneOf, data, schemaPath.append('oneOf'), jsonPath, counter == 1, 'oneOf');
        this.#resumeMapping();
        return counter == 1;
      },
      'required': (data,required)=>required.reduce((acc,r)=>acc&&r in data,true),
      'dependentRequired': (data,dependentRequired)=>{
        for( const [prop,required] of Object.entries(dependentRequired) )
          if( prop in data && !required.reduce((acc,r)=>acc&&r in data,true) )
            return false;
        return true;
      },
      'pattern': (data,pattern)=>new RegExp(pattern).test(data),
    },
    'any': {
      '@name': 'any',
      'type': ()=>true,
    },
    'string': {
      '@name': 'string',
      'type': data=>typeof data == 'string',
      'enum': (data,enums)=>enums.includes(data),
      'const': (data, constant)=>data==constant,
      'minLength': (data,len)=>data.length>=len,
      'maxLength': (data,len)=>data.length<=len,
      'pattern': (data,pattern)=>new RegExp(pattern).test(data),
      'format': (data,format)=>IMPLEMENTATION_MISSING(true), // this is primarily meant for anotation. https://json-schema.org/understanding-json-schema/reference/string.html
      'anyOf': (data, anyOf, schema, schemaPath, jsonPath, unmatchedProperties)=>this.#validators.$.anyOf(data, anyOf, schema, schemaPath, jsonPath, unmatchedProperties),
    },
    'number': {
      '@name': 'number',
      'type': data=>typeof data == 'number',
      'const': (data, constant)=>data==constant,
      'multipleOf': (data,multiple)=>data%multiple==0,
      'minimum': (data,limit)=>data>=limit,
      'exclusiveMinimum': (data,limit)=>data>limit,
      'maximum': (data,limit)=>data<=limit,
      'exclusiveMaximum': (data,limit)=>data<limit,
    },
    'integer': {
      '@name': 'integer',
      'type': data=>Number.isInteger(data),
      'const': (data, constant)=>data==constant,
      'multipleOf': (data,multiple)=>data%multiple==0,
      'minimum': (data,limit)=>data>=limit,
      'exclusiveMinimum': (data,limit)=>data>limit,
      'maximum': (data,limit)=>data<=limit,
      'exclusiveMaximum': (data,limit)=>data<limit,
    },
    'object': [ // validators are grouped to provide prioritized validation
      { // prio 0
        '@name': 'object (prio 0)',
        'type': data=>typeof data == 'object',
        'properties': (data, properties, schema, schemaPath, jsonPath, unmatchedProperties)=>{
          let result = true;
          for( const p in properties ) {
            if( p in data ) {
              const subSchemaPath = schemaPath.append('properties', p);
              const jsonPath2 = buildJsonPath(jsonPath, p);
              const valid = this.#validate(properties[p], data[p], subSchemaPath, jsonPath2);
              this.#addMatch(properties[p], data[p], subSchemaPath, jsonPath2, valid);
              result &&= valid;
              unmatchedProperties.delete(p);
            }
          }
          return result;
        },
        'patternProperties': (data, properties, schema, schemaPath,  jsonPath, unmatchedProperties)=>{
          let result = true;
          for( const p in properties ) {
            const subSchema = properties[p];
            const rx = new RegExp(p);
            const subSchemaPath = schemaPath.append('patternProperties', rx);
            for( const k in data ) {
              if( rx.test(k) ) {
                const jsonPath2 = buildJsonPath(jsonPath, k);
                const valid = this.#validate(subSchema, data[k], subSchemaPath, jsonPath2);
                this.#addMatch(subSchema, data[k], subSchemaPath, jsonPath2, valid);
                result &&= valid;
                unmatchedProperties.delete(k);
              }
            } 
          }
          return result;
        },
        'required': (...args)=>this.#validators.$.required(...args),
        'propertyNames': (data,{pattern})=>{
          const rx = new RegExp(pattern);
          return Object.keys(data).map(k=>rx.test(k)).reduce((acc,t)=>acc&&=t,true);
        },
        'minProperties': (data,limit)=>Object.keys(data).length>=limit,
        'maxProperties': (data,limit)=>Object.keys(data).length<=limit,
        'definitions': ()=>true,
        'if': (...args)=>this.#validators.$.if(...args),
        'then': (...args)=>this.#validators.$.then(...args),
        'else': (...args)=>this.#validators.$.else(...args),
        'not': (...args)=>this.#validators.$.not(...args),
        'anyOf': (...args)=>this.#validators.$.anyOf(...args),
        'allOf': (...args)=>this.#validators.$.allOf(...args),
        'oneOf': (...args)=>this.#validators.$.oneOf(...args),
      },
      { // prio 1
        '@name': 'object (prio 1)',
        'additionalProperties': (data, additionalProperties, schema, schemaPath, jsonPath, unmatchedProperties)=>{
          if( additionalProperties == true || unmatchedProperties.size == 0 ) return true; // works because this validator has prio 2
          if( additionalProperties == false ) return false;
          
          const subSchemaPath = schemaPath.append('additionalProperties');
          let aggValid = true;
          const additionals = [...unmatchedProperties];
          for( const a of additionals ) {
            const jsonPath2 = buildJsonPath(jsonPath, a);
            const valid = this.#validate(additionalProperties, data[a], subSchemaPath, jsonPath2);
            this.#addMatch(additionalProperties, data[a], subSchemaPath, jsonPath2, valid);
            if( valid ) 
              unmatchedProperties.delete(a);
            aggValid &&= valid;
          }
          return aggValid;
        },
        'unevaluatedProperties': (data,allow,schema)=>IMPLEMENTATION_MISSING(true),
      }
    ],
    'array': {
      '@name': 'array',
      'type': data=>Array.isArray(data),
      '__items': (data, itemSchema, skip, schema, schemaPath, jsonPath, unmatchedProperties)=>{
        skip ??= 0;
        if( data.length <= skip ) return true;
        if( itemSchema == false ) return false;
        const subSchemaPath = schemaPath.append('items');
        let result = true;
        for( let i = skip ; i < data.length ; i++ ) {
          const jsonPath2 = buildJsonPath(jsonPath, i);
          const valid = this.#validate(itemSchema, data[i], subSchemaPath, jsonPath2);
          this.#addMatch(itemSchema, data[i], subSchemaPath, jsonPath2, valid);
          unmatchedProperties.delete(`${i}`);
          result &&= valid;
        }
        return result;
      },
      'items': (data, itemSchema, schema, schemaPath, jsonPath, unmatchedProperties)=>{
        if( schema.prefixItems != undefined ) return true; // validation is performed by prefixSchema validator
        return this.#validators.array.__items(data, itemSchema, 0, schema, schemaPath, jsonPath, unmatchedProperties);
      },
      'prefixItems': (data, prefixItems, schema, schemaPath, jsonPath, unmatchedProperties)=>{
        let aggValid = true;
        for( let i = 0 ; i < prefixItems.length ; i++ ) {
          const subSchemaPath = schemaPath.append('prefixItems', i);
          const jsonPath2 = buildJsonPath(jsonPath, i);
          const valid = this.#validate(prefixItems[i], data[i], subSchemaPath, jsonPath2);
          this.#addMatch(prefixItems[i], data[i], subSchemaPath, jsonPath2, valid);
          unmatchedProperties.delete(`${i}`);
          aggValid &&= valid;
        }
        return this.#validators.array.__items(data, schema.items, prefixItems.length, schema, schemaPath, jsonPath, unmatchedProperties) && aggValid;
      },
      'contains': (data,contains,schema,schemaPath,jsonPath, unmatchedProperties)=>{
        const min = schema.minContains ?? 1;
        const max = schema.maxContains ?? Infinity;
        const subSchemaPath = schemaPath.append('contains');
        let count = 0;
        for( let i = 0 ; i < data.length ; i++ ) {
          const jsonPath2 = buildJsonPath(jsonPath, i);
          if( this.#validate(contains, data[i], subSchemaPath, jsonPath2) ) {
            unmatchedProperties.delete(`${i}`);
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
      'const': (data, constant)=>data==constant,
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
    'default': true,
    'examples': true,
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

  constructor(schemaObject,dataObject, options) {
    this.#options = Object.assign({mapNonObjects: MAP_NON_OBJECTS, mapSubConditions: MAP_SUBCONDITIONS}, options);
    this.#schema = schemaObject;
    this.#data = dataObject;
    
    this.#startMapping();
  }
  
  #resolveSubSchema(schema) {
    if( schema == undefined ) return undefined;
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
  #pauseMapping() {
    ++this.#pauseMappingCount;
  }
  #resumeMapping() {
    if( --this.#pauseMappingCount < 0 ) this.#pauseMappingCount = 0;
  }
  #addMatch(schema, json, schemaPath, jsonPath, valid) {
    if( !this.#pauseMappingCount 
        && ( this.#options.mapNonObjects || typeof json == 'object' ) ) // arrays are also objects
      this.#matches.push(new SchemaObjectMatch(this.#resolveSubSchema(schema), json, schemaPath, jsonPath, valid));
  }
  #addSubCondition(schema, json, schemaPath, jsonPath, valid) {
    if( this.#options.mapSubConditions == 'all' || (valid == false && this.#options.mapSubConditions == 'failed') )
      this.#matches.push(new SchemaObjectMatch(this.#resolveSubSchema(schema), json, schemaPath, jsonPath, valid));
  }
  #runTypeValidators(typeValidators, schema, json, schemaPath, jsonPath, unmatchedProperties) {
    const definedValidators = [];
    if( !Array.isArray(typeValidators) )
      typeValidators = [typeValidators];
    else
      typeValidators.forEach(tv=>definedValidators.push(...Object.keys(tv)));

    let valid = true;
    for( const tv of typeValidators ) {
      for( const k in schema ) {
        const validator = tv[k] ?? (definedValidators.includes(k) || this.#validatorFallbacks[k]);
        if( typeof validator == 'function' )
          valid &&= validator(json, schema[k], schema, schemaPath, jsonPath, unmatchedProperties);
        else if( validator != true )
          NOT_SUPPORTED(`"${k}"`, tv['@name'], schemaPath.paths);
      } 
    }
    return valid;   
  }
  #validate(schema, json, schemaPath, jsonPath) {
    //console.log(...arguments);
    if( schema['$ref'] != undefined ) {
      schemaPath.addSubschema(schema['$ref']);
      schema = this.#resolveSubSchema(schema);
    }
  
    const typeValidators = Array.isArray(schema.type)
                             ? schema.type.map(t=>this.#validators[t])
                             : [this.#validators[schema.type ?? '$']];

    const unmatchedProperties = typeof json != 'object'? new Set() : new Set(Object.keys(json));

    const valid = typeValidators
      .map(tv=>this.#runTypeValidators(tv, schema, json, schemaPath, jsonPath, unmatchedProperties))
      .reduce((acc,v)=>acc||v, false);
      
    if( unmatchedProperties.size > 0 ) {
      const subSchemaPath = schemaPath.appendUnmatched();
      for( const u of unmatchedProperties ) {
        this.#addMatch(undefined, json[u], subSchemaPath, buildJsonPath(jsonPath,u), 'unmatched');
      }
      //return valid && unmatchedProperties.size == 0;
    }
    return valid;
  }  
  #startMapping() {
    const schemaPath = new JsonSchemaPath();
    const valid = this.#validate(this.#schema, this.#data, schemaPath.clone(), '');
    this.#addMatch(this.#schema, this.#data, schemaPath, '', valid)
  }
  
  get mapped() {
    return this.#matches;
  }
  findAll(search) {
    switch( typeof search ) {
      case 'object':
        return this.#matches.filter(m=>m.data === search);
      case 'string':
        return this.#matches.filter(m=>m.jsonPath === search);
      case 'function':
      	return this.#matches.filter(search);
      default:
        return []; 
    }
  }
}

module.exports = JsonSchemaObjectMapper;
