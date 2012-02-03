var assert = require('assert');
var Schema = require('../index.js');

describe('sanitize when not strict', function() {
  var schema = new Schema({
    id: 'S',
    created_at: 'N',
    colors: 'SS',
    dates: 'NN'
  }, false);

  it('should return a dynamo formatted object with valid data and extra params', function() {
    var rv = schema.sanitize({
      id: 'A', 
      created_at: '1', 
      colors: ['red', 'blue'], 
      dates: [1, 2],
      junk: 1
    });
    assert.deepEqual(rv.id.S, 'A');
    assert.deepEqual(rv.created_at.N, '1');
    assert.deepEqual(rv.colors.SS[0], 'red');
    assert.deepEqual(rv.colors.SS[1], 'blue');
    assert.deepEqual(rv.dates.NN[0], '1');
    assert.deepEqual(rv.dates.NN[1], '2');
    assert.deepEqual(rv.junk, undefined);
  });

  it('should throw with badly formatted data', function() {
    assert.throws(function() {
      schema.sanitize({
         id: 'A',
         created_at: 'X'
      }, Error);
    });
  });
});

describe('sanitize and parse a valid object', function() {
  var schema = new Schema({
    id: 'S',
    created_at: 'N',
    colors: 'SS',
    dates: 'NN'
  });
  var object = {id: 'me', created_at: 1, colors: ['red', 'blue'], dates: [0, 1]};
  describe('without bignums', function() {
    it('should return the original object', function() {
      var new_object = schema.parse(schema.sanitize(object));
      assert.deepEqual(new_object.id, object.id);
      assert.deepEqual(new_object.created_at, object.created_at);
      assert.deepEqual(new_object.colors[0], object.colors[0]);
      assert.deepEqual(new_object.colors[1], object.colors[1]);
      assert.deepEqual(new_object.dates[0], object.dates[0]);
      assert.deepEqual(new_object.dates[1], object.dates[1]);
    });
  });
  describe('with bignums', function() {
    it('should return the original object except with bignums', function() {
      var new_object = schema.parse(schema.sanitize(object), true);
      assert.deepEqual(new_object.id, object.id);
      assert.deepEqual(new_object.created_at, '1');
      assert.deepEqual(new_object.colors[0], object.colors[0]);
      assert.deepEqual(new_object.colors[1], object.colors[1]);
      assert.deepEqual(new_object.dates[0], '0');
      assert.deepEqual(new_object.dates[1], '1');
    });
  });
});

describe('sanitize_string', function() {
  
  describe('when a string is passed in', function() {
    it('should return a string when strict = false', function() {
      assert.equal(Schema.sanitize_string('', 'somestring', false), 'somestring');
    });
    it('should return a string when strict = true', function() {
      assert.equal(Schema.sanitize_string('', 'somestring', false), 'somestring');
    });
  });
  
  describe('when a number is passed in', function() {
    it('should return a string when strict = false', function() {
      assert.equal(Schema.sanitize_string('', 1, false), '1');
    });
    it('should throw when strict = true', function() {
      assert.throws(function() {
        Schema.sanitize_string('', 1, true);
      }, Error);
    });
  });

});

describe('sanitize_number', function() {
  
  describe('when a number is passed in', function() {
    it('should return a string when strict = false', function() {
      assert.equal(Schema.sanitize_number('', 1, false), '1');
    });
    it('should return a string when strict = true', function() {
      assert.equal(Schema.sanitize_number('', 1, false), '1');
    });
  });

  describe('when a string is passed in', function() {
    it('should return a string when strict = false', function() {
      assert.equal(Schema.sanitize_number('', '1', false), '1');
    });
    it('should throw when strict = true', function() {
      assert.throws(function() {
        Schema.sanitize_number('', '1', true);
      }, Error);
    });
    it('should return a string if the passed in string is a double', function() {
      assert.equal(Schema.sanitize_number('', '1.5', false), '1.5');
    });
    it('should throw when the string is not a valid number', function() {
      assert.throws(function() {
       Schema.sanitize_number('', '1.5x', false);
      }, Error);
      assert.throws(function() {
        Schema.sanitize_number('', 'xxx', false);
      }, Error);
      assert.throws(function() {
        Schema.sanitize_number('', 'xxx22', false);
      }, Error);
    });
  });
});
  
var valid_stringset = function(stringset) {
  assert.deepEqual(stringset[0], 'a');
  assert.deepEqual(stringset[1], 'b');
  assert.deepEqual(stringset[2], 'c');
};

var valid_numset = function(numset) {
  assert.deepEqual(numset[0], '0');
  assert.deepEqual(numset[1], '1');
  assert.deepEqual(numset[2], '2');
};

var stringlist = ['a','b','c'];
var numlist = [0,1,2];
var numstrings = ['0', '1', '2'];

describe('sanitize_string_set', function() {
  describe('when a list of strings is passed in', function() {
    it('should return a list of strings with and without strict mode', function() {
      var stringset = Schema.sanitize_string_set('', stringlist, false); 
      valid_stringset(stringset);
      stringset = Schema.sanitize_string_set('', stringlist, true);
      valid_stringset(stringset);
    });
  });
  describe('when a list of numbers is passed in', function() {
    it('should return a list of strings when strict = false', function() {
      var numset = Schema.sanitize_string_set('', numlist, false);
      assert.deepEqual(numset[0], '0');
      assert.deepEqual(numset[1], '1');
      assert.deepEqual(numset[2], '2');
    });
    it('should throw when strict = true', function() {
      assert.throws(function() {
        Schema.sanitize_string_set('', numlist, true); 
      }, Error);
    });
  });
});

describe('sanitize_number_set', function() {

  describe('when a list of numbers is passed in', function() {
    it('should return a list of numberstrings with and without stict mode', function() {
      var numset = Schema.sanitize_number_set('', numlist, false);
      valid_numset(numset);
      var numset = Schema.sanitize_number_set('', numlist, true);
      valid_numset(numset);
    });
  });

  describe('when a list of numberstrings is passed in', function() {
    it('should return a list of numberstrings when strict = false', function() {
      var numset = Schema.sanitize_number_set('', numstrings, false);
      valid_numset(numset);
    });
    it('should throw when strict = true', function() {
      assert.throws(function() {
        Schema.sanitize_number_set('', numstrings, true);
      }, Error);
    });
  });
  
  describe('when a list of invalid numberstrings are passed in', function() {
    it('should throw with and without strict mode', function() {
      assert.throws(function() {
        Schema.sanitize_number_set('', ['0', '1x'], false);
      });
      assert.throws(function() {
        Schema.sanitize_number_set('', ['a', '22'], true);
      });
    });
  });

});
