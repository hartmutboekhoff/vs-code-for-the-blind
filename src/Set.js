function addMissingMethod(classObject,name,func) {
  if( !Object.hasOwn(classObject.prototype, name) )
    Object.defineProperty(classObject.prototype, name, {value: func});
}

addMissingMethod(Set, 'union', function(other) {
  const union = new Set(this);
  for( const k of other )
    if( !union.has(k) )
      union.add(k);
 return union;
});
addMissingMethod(Set, 'difference', function(other) {
  const difference = new Set();
  for( const k of this )
    if( !other.has(k) )
      difference.add(k);
  return difference;
});
addMissingMethod(Set, 'intersection', function(other) {
  const intersection = new Set();
  for( const k of this )
    if( other.has(k) )
      intersection.add(k);
  return intersection;
});
addMissingMethod(Set,'symmetricDifference', function(other) {
  const symmetricDifference = new Set(this);
  for( const k of other )
    if( symmetricDifference.has(k) )
      symmetricDifference.delete(k);
    else
      symmetricDifference.add(k);
  return symmetricDifference;
});
addMissingMethod(Set, 'isDisjointFrom', function(other) {
  for( const k of this )
    if( other.has(k) ) 
      return false;
  return true;
});
addMissingMethod(Set, 'isSubsetOf', function(other) {
  for( const k of this )
    if( !other.has(k) )
      return false;
  return true;
});
addMissingMethod(Set, 'isSupersetOf', function(other) {
  for( const k of other )
    if( !this.has(k) )
      return false;
  return true;
});

/*
class SetV2 extends Set {
  constructor(...args) {
    super(...args);
  }
  union(other) {
    const union = new SetV2(this);
    for( const k of other )
      if( !union.has(k) )
        union.add(k);
   return union;
  }
  difference(other) {
    const difference = new SetV2();
    for( const k of this )
      if( !other.has(k) )
        difference.add(k);
    return difference;
  } 
  intersection(other) {
    const intersection = new SetV2();
    for( const k of this )
      if( other.has(k) )
        intersection.add(k);
    return intersection;
  } 
  symmetricDifference(other) {
    const symmetricDifference = new SetV2(this);
    for( const k of other )
      if( symmetricDifference.has(k) )
        symmetricDifference.delete(k);
      else
        symmetricDifference.add(k);
    return symmetricDifference;
  }
  isDisjointFrom(other) {
    for( const k of this )
      if( other.has(k) ) 
        return false;
    return true;
  }
  isSubsetOf(other) {
    for( const k of this )
      if( !other.has(k) )
        return false;
    return true;
  }
  isSupersetOf(other) {
    for( const k of other )
      if( !this.has(k) )
        return false;
    return true;
  }
}

module.exports = SetV2;
*/