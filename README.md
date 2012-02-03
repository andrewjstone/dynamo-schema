dynamo-schema is a sanitization and validation module for Amazon DynamoDB data models. It is meant as an item schema and is meant to be used in conjunction with the low level methods provided by dynamo drivers such as [this one](https://github.com/jed/dynamo) . 

## Example

```javascript
var Schema = require('dynamo-schema');

schema = new Schema({
  name: 'S',
  created_at: 'N',
  colors: 'SS',
  dates: 'NN'
});

var output = schema.sanitize({
  name: 'Andrew',
  created_at: Date.now(),
  colors: ['red', 'blue'],
  dates: [Date.now()+1000, Date.now()+2000]
});

var new_object = schema.parse(output);

// new object should be identical to the original object passed into sanitize
```

## Install

    npm install dynamo-schema
    
## Run Tests
Ensure you have mocha installed. ```npm install mocha```.

    mocha test/test.js --reporter spec

## TODO

  * Per Attribute bignum support
  * More types to use in schema definitions
    * enum
    * dates
    * regex
  * More tests
  * API docs
