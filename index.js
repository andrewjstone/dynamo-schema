var isArray = require('util').isArray;

var Schema = module.exports = function(schema, strict) {
  this.schema = schema;
  this.strict = strict;
  this.tree = {};
  this.build_tree();
};

// Parse the schema and build a sanitization tree
// Throw on schema error
Schema.prototype.build_tree = function() {
  for (var k in this.schema) {
    if (this.schema.hasOwnProperty(k)) {
      var val = this.schema[k];
      if (typeof val === 'string') {
        if (val === 'S') {
          this.tree[k] = {sanitize: sanitize_string, parse: parse_string};
        } else if (val === 'N') {
          this.tree[k] = {sanitize: sanitize_number, parse: parse_number};
        } else if (val === 'SS') {
          this.tree[k] = {sanitize: sanitize_string_set, parse: parse_string_set};
        } else if (val === 'NN') {
          this.tree[k] = {sanitize: sanitize_number_set, parse: parse_number_set};
        } else {
          throw new Error('Invalid type for attribute '+k+'. Must be one of S, N, SS, NN.');
        }
      } else {
        throw new Error('Only strings are currently supported as attribute values');
      }
    }
  }
};

// Parse a dynamo object and return one without types
// If an attribute isn't in the schema don't return it in the new object
// If `bignums` is set then return the numberstring and not a parsed number
Schema.prototype.parse = function(dynamo_object, bignums) {
  var rv = {};
  for (var k in dynamo_object) {
    if (this.strict && !this.tree[k]) throw new Error('Invalid Attribute '+k);
    if (this.tree[k]) {
      rv[k] = this.tree[k].parse(k, dynamo_object[k], bignums);   
    }
  }
  return rv;
};

function parse_error(attr, val) {
   throw new Error('Wrong type for attribute '+attr+'. val = '+inspect(val));
};

function parse_string(attr, val) {
   if (val.S) return val.S;  
   parse_error(attr, val);
};
function parse_number(attr, val, bignums) {
  if (val.N && bignums) return val.N;
  if (val.N) return Number(val.N);
  parse_error(attr, val);
};

function parse_string_set(attr, val) {
  if (val.SS) return val.SS;
  parse_error(attr, val);
};

function parse_number_set(attr, val, bignums) {
  if (val.NN && bignums) return val.NN;
  if (val.NN) {
    var rv = [];
    val.NN.forEach(function(numstring) {
      rv.push(Number(numstring));
    });
    return rv;
  };
  parse_error(attr, val);
};

// Return a dynamo formatted object
// {
//   id: {S : 'joemama'},
//   created_at: {N: '12345'},
//   colors: {SS: ['blue', 'red']}
//   nums: {NN: ['12345', '67890']}
// }
//
// If a strict mode is not on and an attribute not in the schema is given, just ignore it
Schema.prototype.sanitize = function(data) {
  var rv = {};
  for (var k in data) {
    if (this.strict && !this.tree[k]) throw new Error('Invalid Attribute '+k);
    if (this.tree[k]) {
      var sanitized = this.tree[k].sanitize(k, data[k], this.strict);   
      rv[k] = this.format(k, sanitized);
    }
  }
  return rv;
};

// Attach the following functions to the Schema object just for testing
Schema.sanitize_string = sanitize_string;
Schema.sanitize_number = sanitize_number;
Schema.sanitize_string_set = sanitize_string_set;
Schema.sanitize_number_set = sanitize_number_set;

Schema.prototype.format = function(attr, value) {
  var dynamo_formatted_attr = {};
  dynamo_formatted_attr[this.schema[attr]] = value;
  return dynamo_formatted_attr;
};

function sanitize_string(attr, str, strict) {
  if (typeof str === 'string') return str;
  if (strict) throw new Error('Invalid string for attribute '+attr);
  
  // If it's a number then cast it to a string, otherwise throw
  if (typeof str === 'number') return String(str);
  
  throw new Error('Cannot cast type '+typeof str + 'to string for attribute '+attr);
}

function sanitize_number(attr, num, strict) {
  if (typeof num === 'number') return String(num);
  if (strict) throw new Error('Invalid number for attribute '+attr);

  if (typeof num === 'string') {
    if (/^[-+]?[0-9]*\.?[0-9]+$/.test(num)) return num;
  }

  throw new Error('Invalid number for attribute '+attr);
}

function sanitize_set(attr, list, strict, sanitizer) {
  var set = [];
  //TODO: Remove duplicates
  if (!isArray(list)) throw new Error('Invalid string set for attribute '+attr);
  for (var i = 0; i < list.length; i++) {
    var val = list[i];
    var sanitized = sanitizer(attr+'_'+i, val, strict);
    set[i] = sanitized;
  }
  return set;
};

function sanitize_string_set(attr, set, strict) {
  return sanitize_set(attr, set, strict, sanitize_string);
};

function sanitize_number_set(attr, set, strict) {
  return sanitize_set(attr, set, strict, sanitize_number);
};
